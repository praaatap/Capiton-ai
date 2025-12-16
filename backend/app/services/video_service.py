"""Video processing service using FFmpeg and MoviePy."""
import os
import uuid
import subprocess
import json
from pathlib import Path
from typing import Optional, List, Tuple
# Removed MoviePy imports to avoid dependency issues on Windows without C++ tools
# Using pure FFmpeg for operations


from app.config import get_settings
from app.models.video import (
    Video, VideoStatus, VideoMetadata, SubtitleSegment, SubtitleStyle
)
from app.services.cache_service import cache_service

settings = get_settings()


class VideoService:
    """Service for video processing operations."""
    
    async def save_uploaded_video(self, file_content: bytes, filename: str) -> Video:
        """Save uploaded video and create video record.
        Automatically converts portrait videos to landscape format.
        """
        video_id = str(uuid.uuid4())
        extension = Path(filename).suffix.lower()
        
        # Save file
        saved_filename = f"{video_id}{extension}"
        file_path = settings.UPLOAD_DIR / saved_filename
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Get metadata
        metadata = await self.get_video_metadata(str(file_path))
        
        # Log video orientation for debugging
        is_portrait = metadata.height > metadata.width
        if is_portrait:
            print(f"📱 Portrait video detected ({metadata.width}x{metadata.height}) - keeping original format")
        else:
            print(f"📺 Landscape video detected ({metadata.width}x{metadata.height})")
        
        # Create video record
        video = Video(
            id=video_id,
            filename=saved_filename,
            original_filename=filename,
            status=VideoStatus.UPLOADED,
            metadata=metadata
        )
        
        # Cache video data
        await cache_service.set_video(video_id, video.model_dump(mode="json"))
        
        return video
    
    async def get_video_metadata(self, file_path: str) -> VideoMetadata:
        """Extract video metadata using FFprobe."""
        cmd = [
            settings.ffprobe_binary,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            file_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            video_stream = next(
                (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
                {}
            )
            format_info = data.get("format", {})
            
            # Calculate FPS
            fps_str = video_stream.get("r_frame_rate", "30/1")
            fps_parts = fps_str.split("/")
            fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 30.0
            
            return VideoMetadata(
                duration=float(format_info.get("duration", 0)),
                width=int(video_stream.get("width", 0)),
                height=int(video_stream.get("height", 0)),
                fps=fps,
                file_size=int(format_info.get("size", 0)),
                format=format_info.get("format_name", "unknown")
            )
        except Exception as e:
            print(f"Error getting metadata: {e}")
            return VideoMetadata(
                duration=0, width=0, height=0, fps=30.0, file_size=0, format="unknown"
            )
    
    async def get_video(self, video_id: str) -> Optional[Video]:
        """Get video by ID from cache."""
        video_data = await cache_service.get_video(video_id)
        if video_data:
            return Video(**video_data)
        return None
    
    async def update_video(self, video: Video) -> Video:
        """Update video in cache."""
        from datetime import datetime
        video.updated_at = datetime.utcnow()
        await cache_service.set_video(video.id, video.model_dump(mode="json"))
        return video
    
    async def list_videos(self) -> List[Video]:
        """List all videos from cache."""
        video_ids = await cache_service.list_video_ids()
        videos = []
        for vid in video_ids:
            video_data = await cache_service.get_video(vid)
            if video_data:
                videos.append(Video(**video_data))
        # Sort by updated_at descending
        videos.sort(key=lambda v: v.updated_at, reverse=True)
        return videos
    
    def get_video_path(self, video: Video) -> Path:
        """Get full path to video file."""
        return settings.UPLOAD_DIR / video.filename
    
    async def delete_video(self, video_id: str) -> bool:
        """Delete video and its files."""
        video = await self.get_video(video_id)
        if not video:
            return False
        
        # Delete video file
        video_path = self.get_video_path(video)
        if video_path.exists():
            video_path.unlink()
        
        # Delete exported file if exists
        if video.exported_path:
            export_path = Path(video.exported_path)
            if export_path.exists():
                export_path.unlink()
        
        # Delete trimmed file if exists
        trimmed_path = settings.UPLOAD_DIR / f"{video_id}_trimmed.mp4"
        if trimmed_path.exists():
            trimmed_path.unlink()
        
        # Remove from cache
        await cache_service.delete_video(video_id)
        
        return True
    
    async def detect_silence(
        self,
        video_id: str,
        silence_threshold: float = -40,
        min_silence_duration: float = 0.5
    ) -> List[Tuple[float, float]]:
        """Detect silent portions in video audio."""
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        video_path = self.get_video_path(video)
        
        # Use FFmpeg to detect silence
        cmd = [
            settings.ffmpeg_binary,
            "-i", str(video_path),
            "-af", f"silencedetect=noise={silence_threshold}dB:d={min_silence_duration}",
            "-f", "null",
            "-"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Parse silence detection output
        silent_segments = []
        lines = result.stderr.split("\n")
        start_time = None
        
        for line in lines:
            if "silence_start:" in line:
                try:
                    start_time = float(line.split("silence_start:")[1].strip().split()[0])
                except (IndexError, ValueError):
                    pass
            elif "silence_end:" in line and start_time is not None:
                try:
                    parts = line.split("silence_end:")[1].strip().split()
                    end_time = float(parts[0])
                    silent_segments.append((start_time, end_time))
                    start_time = None
                except (IndexError, ValueError):
                    pass
        
        return silent_segments
    
    async def trim_silence(
        self,
        video_id: str,
        silence_threshold: float = -40,
        min_silence_duration: float = 0.5,
        padding: float = 0.1
    ) -> Tuple[float, float, int]:
        """Trim silent portions from video using FFmpeg."""
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        video_path = self.get_video_path(video)
        silent_segments = await self.detect_silence(
            video_id, silence_threshold, min_silence_duration
        )
        
        original_duration = video.metadata.duration
        
        if not silent_segments:
            return original_duration, original_duration, 0
            
        # 1. Calculate Keep Segments
        keep_segments = []
        current_time = 0.0
        
        for start, end in silent_segments:
            # Keep from current to silence start (+ padding)
            keep_end = start + padding
            if keep_end > current_time:
                keep_segments.append((current_time, keep_end))
            current_time = end - padding
        
        # Keep remaining
        if current_time < original_duration:
             keep_segments.append((current_time, original_duration))
             
        if not keep_segments:
             return original_duration, original_duration, len(silent_segments)

        # 2. Build FFmpeg Filter Complex
        # [0:v]trim=start=S:end=E,setpts=PTS-STARTPTS[v0];
        # [0:a]atrim=start=S:end=E,asetpts=PTS-STARTPTS[a0];
        filter_parts = []
        concat_v = []
        concat_a = []
        
        for i, (start, end) in enumerate(keep_segments):
            # Ensure boundaries are within duration
            start = max(0, start)
            end = min(original_duration, end)
            if start >= end:
                continue
                
            filter_parts.append(f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[v{i}]")
            filter_parts.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]")
            concat_v.append(f"[v{i}]")
            concat_a.append(f"[a{i}]")
        
        if not concat_v:
             return original_duration, original_duration, len(silent_segments)

        n = len(concat_v)
        concat_str = f"{''.join(concat_v)}{''.join(concat_a)}concat=n={n}:v=1:a=1[outv][outa]"
        filter_parts.append(concat_str)
        filter_complex = ";".join(filter_parts)
        
        trimmed_filename = f"{video_id}_trimmed.mp4"
        trimmed_path = settings.UPLOAD_DIR / trimmed_filename
        
        cmd = [
            settings.ffmpeg_binary, "-y",
            "-i", str(video_path),
            "-filter_complex", filter_complex,
            "-map", "[outv]", "-map", "[outa]",
            "-c:v", "libx264", "-c:a", "aac",
            str(trimmed_path)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Get new duration
            new_metadata = await self.get_video_metadata(str(trimmed_path))
            new_duration = new_metadata.duration
            
             # Update video record
            video.filename = trimmed_filename
            video.metadata.duration = new_duration
            await self.update_video(video)
            
            return original_duration, new_duration, len(silent_segments)
            
        except subprocess.CalledProcessError as e:
            print(f"Trim failed: {e.stderr}")
            # Fallback
            return original_duration, original_duration, 0

    
    async def export_with_subtitles(
        self,
        video_id: str,
        output_format: str = "mp4"
    ) -> str:
        """Export video with burned-in subtitles using MoviePy + Pillow."""
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        video_path = self.get_video_path(video)
        output_filename = f"{video_id}_exported.{output_format}"
        output_path = settings.EXPORT_DIR / output_filename
        
        # Update status
        video.status = VideoStatus.EXPORTING
        await self.update_video(video)
        
        try:
            from moviepy import VideoFileClip, ImageClip, CompositeVideoClip
            from PIL import Image, ImageDraw, ImageFont
            import numpy as np
            
            # Load video
            clip = VideoFileClip(str(video_path))
            
            if video.subtitles:
                text_clips = []
                
                # Detect language from subtitle text to choose font
                def get_font_for_text(text):
                    """Get appropriate font based on text content."""
                    # Check for Hindi/Devanagari characters
                    has_hindi = any('\u0900' <= c <= '\u097F' for c in text)
                    # Check for Chinese/Japanese
                    has_cjk = any('\u4E00' <= c <= '\u9FFF' or '\u3040' <= c <= '\u30FF' for c in text)
                    # Check for Tamil
                    has_tamil = any('\u0B80' <= c <= '\u0BFF' for c in text)
                    # Check for Telugu
                    has_telugu = any('\u0C00' <= c <= '\u0C7F' for c in text)
                    
                    if has_hindi:
                        # Hindi fonts
                        hindi_fonts = [
                            "C:/Windows/Fonts/NirmalaUI.ttf",
                            "C:/Windows/Fonts/mangal.ttf",
                            "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
                        ]
                        for fp in hindi_fonts:
                            if Path(fp).exists():
                                return fp
                    elif has_cjk:
                        # CJK fonts
                        cjk_fonts = [
                            "C:/Windows/Fonts/msyh.ttc",
                            "C:/Windows/Fonts/simsun.ttc",
                        ]
                        for fp in cjk_fonts:
                            if Path(fp).exists():
                                return fp
                    elif has_tamil or has_telugu:
                        tamil_fonts = [
                            "C:/Windows/Fonts/NirmalaUI.ttf",
                        ]
                        for fp in tamil_fonts:
                            if Path(fp).exists():
                                return fp
                    
                    # Default English/Latin fonts
                    english_fonts = [
                        "C:/Windows/Fonts/arial.ttf",
                        "C:/Windows/Fonts/segoeui.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    ]
                    for fp in english_fonts:
                        if Path(fp).exists():
                            return fp
                    
                    return None
                
                for sub in video.subtitles:
                    text_content = sub.text
                    font_path = get_font_for_text(text_content)
                    
                    # Professional subtitle style - optimized for 1080p landscape
                    def make_subtitle_frame(t, text=text_content, fpath=font_path, video_width=int(clip.w), video_height=int(clip.h)):
                        # For 1080p landscape (1920x1080), use ~40px font
                        # Scale based on video dimensions
                        is_landscape = video_width > video_height
                        if is_landscape:
                            # For landscape: 2.2% of width gives good readable size
                            base_font_size = max(36, int(video_width * 0.022))
                            max_text_width = int(video_width * 0.85)  # 85% of width for text
                        else:
                            # For portrait: smaller font, narrower width
                            base_font_size = max(28, int(video_height * 0.028))
                            max_text_width = int(video_width * 0.90)  # 90% of portrait width
                        
                        # Load font
                        try:
                            if fpath:
                                font = ImageFont.truetype(fpath, base_font_size)
                            else:
                                font = ImageFont.load_default()
                        except:
                            font = ImageFont.load_default()
                        
                        # Wrap text to fit within max_text_width
                        def wrap_text(text, font, max_width):
                            """Wrap text to fit within max_width."""
                            words = text.split()
                            lines = []
                            current_line = []
                            
                            temp_img = Image.new('RGBA', (1, 1))
                            temp_draw = ImageDraw.Draw(temp_img)
                            
                            for word in words:
                                test_line = ' '.join(current_line + [word])
                                bbox = temp_draw.textbbox((0, 0), test_line, font=font)
                                line_width = bbox[2] - bbox[0]
                                
                                if line_width <= max_width:
                                    current_line.append(word)
                                else:
                                    if current_line:
                                        lines.append(' '.join(current_line))
                                    current_line = [word]
                            
                            if current_line:
                                lines.append(' '.join(current_line))
                            
                            return lines if lines else [text]
                        
                        # Get wrapped lines
                        lines = wrap_text(text, font, max_text_width)
                        
                        # Calculate line dimensions
                        temp_img = Image.new('RGBA', (1, 1))
                        temp_draw = ImageDraw.Draw(temp_img)
                        
                        line_heights = []
                        line_widths = []
                        for line in lines:
                            bbox = temp_draw.textbbox((0, 0), line, font=font)
                            line_widths.append(bbox[2] - bbox[0])
                            line_heights.append(bbox[3] - bbox[1])
                        
                        max_line_width = max(line_widths) if line_widths else 100
                        line_height = max(line_heights) if line_heights else base_font_size
                        line_spacing = int(line_height * 0.3)  # 30% spacing between lines
                        
                        # Padding scales with font size
                        padding_x = max(20, base_font_size // 2)
                        padding_y = max(12, base_font_size // 3)
                        
                        total_text_height = (line_height * len(lines)) + (line_spacing * (len(lines) - 1))
                        box_width = max_line_width + (padding_x * 2)
                        box_height = total_text_height + (padding_y * 2)
                        
                        # Create image - full width of video for proper centering
                        img_height = box_height + 10
                        img = Image.new('RGBA', (video_width, img_height), (0, 0, 0, 0))
                        draw = ImageDraw.Draw(img)
                        
                        # Center the box horizontally
                        box_x = (video_width - box_width) // 2
                        box_y = 5
                        
                        # Semi-transparent black background
                        bg_color = (0, 0, 0, 200)  # 78% opacity
                        
                        # Draw the background box
                        draw.rectangle(
                            [(box_x, box_y), (box_x + box_width, box_y + box_height)],
                            fill=bg_color
                        )
                        
                        # Draw each line of text
                        outline_color = (0, 0, 0, 255)
                        text_color = (255, 255, 255, 255)
                        
                        current_y = box_y + padding_y
                        for i, line in enumerate(lines):
                            # Center each line within the box
                            line_bbox = draw.textbbox((0, 0), line, font=font)
                            line_width = line_bbox[2] - line_bbox[0]
                            text_x = box_x + (box_width - line_width) // 2
                            
                            # Quick 1px outline (faster than 2px)
                            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                                draw.text((text_x + dx, current_y + dy), line, font=font, fill=outline_color)
                            
                            # Main white text
                            draw.text((text_x, current_y), line, font=font, fill=text_color)
                            
                            current_y += line_height + line_spacing
                        
                        return np.array(img)
                    
                    # Create image clip
                    duration = sub.end_time - sub.start_time
                    subtitle_img = make_subtitle_frame(0)
                    
                    img_clip = ImageClip(subtitle_img, duration=duration)
                    # Position inside video frame with safe margin from bottom
                    # Use 8% of video height as bottom margin to ensure subtitle stays within frame
                    bottom_margin = max(60, int(clip.h * 0.08))
                    y_position = clip.h - subtitle_img.shape[0] - bottom_margin
                    # Ensure we don't go negative (stays within video frame)
                    y_position = max(0, min(y_position, clip.h - subtitle_img.shape[0]))
                    img_clip = img_clip.with_position(('center', y_position))
                    img_clip = img_clip.with_start(sub.start_time)
                    
                    text_clips.append(img_clip)
                
                final_clip = CompositeVideoClip([clip] + text_clips)
            else:
                final_clip = clip
            
            # Write output - OPTIMIZED FOR SPEED
            # Using ultrafast preset for significantly faster encoding
            # Trade-off: slightly larger file size but 3-5x faster
            final_clip.write_videofile(
                str(output_path),
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(settings.TEMP_DIR / f"{video_id}_temp_audio.m4a"),
                remove_temp=True,
                fps=clip.fps or 30,
                preset='ultrafast',  # Much faster than 'medium'
                threads=8,  # Use more CPU threads
                ffmpeg_params=['-crf', '23']  # Balanced quality/speed
            )
            
            # Cleanup
            final_clip.close()
            clip.close()
            
            video.status = VideoStatus.EXPORTED
            video.exported_path = str(output_path)
            await self.update_video(video)
            
            print(f"✅ Exported video with {len(video.subtitles or [])} subtitles")
            return str(output_path)
            
        except Exception as e:
            print(f"Export error: {e}")
            import traceback
            traceback.print_exc()
            video.status = VideoStatus.ERROR
            await self.update_video(video)
            raise e
    
    def _create_subtitle_filters(
        self,
        subtitles: List[SubtitleSegment],
        metadata: VideoMetadata
    ) -> List[str]:
        """Create FFmpeg drawtext filters for subtitles."""
        filters = []
        
        for i, sub in enumerate(subtitles):
            style = sub.style
            
            # Calculate position
            if style.position == "top":
                y_pos = "h*0.1"
            elif style.position == "center":
                y_pos = "(h-text_h)/2"
            else:  # bottom
                y_pos = "h*0.85-text_h"
            
            # Convert hex color to FFmpeg format
            font_color = style.font_color.replace("#", "0x")
            outline_color = style.outline_color.replace("#", "0x")
            
            # Build drawtext filter
            input_label = "[0:v]" if i == 0 else f"[v{i}]"
            output_label = f"[v{i+1}]" if i < len(subtitles) - 1 else "[out]"
            
            # Escape special characters in text
            text = sub.text.replace("'", "\\'").replace(":", "\\:")
            
            filter_str = (
                f"{input_label}drawtext="
                f"text='{text}':"
                f"fontsize={style.font_size}:"
                f"fontcolor={font_color}:"
                f"bordercolor={outline_color}:"
                f"borderw={style.outline_width}:"
                f"x=(w-text_w)/2:"
                f"y={y_pos}:"
                f"enable='between(t,{sub.start_time},{sub.end_time})'"
                f"{output_label}"
            )
            
            filters.append(filter_str)
        
        return filters

    async def transform_to_landscape(
        self,
        video_id: str,
        target_width: int = 1920,
        target_height: int = 1080,
        background_blur: bool = True
    ) -> Tuple[int, int, int, int]:
        """
        Transform a portrait/vertical video to landscape format.
        The original video is centered with a blurred background.
        This is useful for Instagram reels and other vertical videos
        so that captions are not cut off.
        
        Returns: (original_width, original_height, new_width, new_height)
        """
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        video_path = self.get_video_path(video)
        original_width = video.metadata.width
        original_height = video.metadata.height
        
        # Check if video is already landscape
        if original_width >= original_height:
            return original_width, original_height, original_width, original_height
        
        # Calculate scaling to fit portrait video in landscape frame
        # while maintaining aspect ratio
        scale_factor = min(target_width / original_width, target_height / original_height)
        scaled_width = int(original_width * scale_factor)
        scaled_height = int(original_height * scale_factor)
        
        # Make sure dimensions are even (required by many codecs)
        scaled_width = scaled_width if scaled_width % 2 == 0 else scaled_width - 1
        scaled_height = scaled_height if scaled_height % 2 == 0 else scaled_height - 1
        
        # Output path
        landscape_filename = f"{video_id}_landscape.mp4"
        landscape_path = settings.UPLOAD_DIR / landscape_filename
        
        if background_blur:
            # Create a blurred, scaled background + centered original video
            # Filter: scale background to fill, blur it, overlay original centered
            filter_complex = (
                f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
                f"crop={target_width}:{target_height},boxblur=20:5[bg];"
                f"[0:v]scale={scaled_width}:{scaled_height}[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
            )
        else:
            # Just center on black background
            filter_complex = (
                f"[0:v]scale={scaled_width}:{scaled_height}[scaled];"
                f"color=black:size={target_width}x{target_height}[bg];"
                f"[bg][scaled]overlay=(W-w)/2:(H-h)/2[outv]"
            )
        
        cmd = [
            settings.ffmpeg_binary, "-y",
            "-i", str(video_path),
            "-filter_complex", filter_complex,
            "-map", "[outv]", "-map", "0:a?",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            str(landscape_path)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Get new metadata
            new_metadata = await self.get_video_metadata(str(landscape_path))
            
            # Update video record
            video.filename = landscape_filename
            video.metadata.width = new_metadata.width
            video.metadata.height = new_metadata.height
            await self.update_video(video)
            
            return original_width, original_height, new_metadata.width, new_metadata.height
            
        except subprocess.CalledProcessError as e:
            print(f"Transform failed: {e.stderr}")
            raise Exception(f"Failed to transform video: {e.stderr.decode() if e.stderr else 'Unknown error'}")

    async def enhance_audio(
        self,
        video_id: str,
        denoise: bool = True,
        normalize: bool = True
    ) -> bool:
        """Enhance video audio using FFmpeg filters."""
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        video_path = self.get_video_path(video)
        enhanced_filename = f"{video_id}_enhanced.mp4"
        enhanced_path = settings.UPLOAD_DIR / enhanced_filename
        
        # filters
        audio_filters = []
        if denoise:
            # Simple highpass/lowpass as proxy for basic noise reduction
            audio_filters.append("highpass=f=100") 
            audio_filters.append("lowpass=f=8000")
        
        if normalize:
            audio_filters.append("loudnorm=I=-16:TP=-1.5:LRA=11")
            
        af_string = ",".join(audio_filters) if audio_filters else "anull"
        
        cmd = [
            settings.ffmpeg_binary, "-y",
            "-i", str(video_path),
            "-c:v", "copy", # Copy video stream without re-encoding
            "-af", af_string,
            "-c:a", "aac",
            str(enhanced_path)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Update record to point to enhanced video
            video.filename = enhanced_filename
            await self.update_video(video)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Audio enhancement failed: {e.stderr}")
            raise Exception(f"Failed to enhance audio: {e}")

    async def generate_viral_clips(
        self,
        video_id: str,
        count: int = 3,
        duration: int = 30
    ) -> List[dict]:
        """
        AI analysis to generate viral clips.
        (Mock implementation for now - returns random segments)
        """
        video = await self.get_video(video_id)
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        import random
        clips = []
        total_duration = video.metadata.duration
        
        for i in range(count):
            # Ensure we don't go out of bounds
            if total_duration <= duration:
                start = 0
                end = total_duration
            else:
                max_start = max(0, total_duration - duration)
                start = random.uniform(0, max_start)
                end = min(total_duration, start + duration)
            
            clips.append({
                "id": str(uuid.uuid4()),
                "start_time": round(start, 2),
                "end_time": round(end, 2),
                "score": round(random.uniform(0.8, 0.99), 2),
                "summary": f"Viral Highlight #{i+1} - Key moment detected"
            })
            
        return clips

    def is_portrait_video(self, video: Video) -> bool:
        """Check if video is in portrait/vertical orientation."""
        if video.metadata and video.metadata.width and video.metadata.height:
            return video.metadata.height > video.metadata.width
        return False


# Singleton instance
video_service = VideoService()


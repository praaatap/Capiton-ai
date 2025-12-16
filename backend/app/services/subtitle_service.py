"""Subtitle generation service using Groq Whisper (whisper-large-v3)."""
import os
import subprocess
from pathlib import Path
from typing import List, Optional

from app.config import get_settings
from app.models.video import SubtitleSegment, SubtitleStyle

settings = get_settings()


class SubtitleService:
    """Service for generating subtitles using Groq Whisper API."""
    
    async def generate_subtitles(
        self,
        video_path: str,
        video_id: str,
        default_style: Optional[SubtitleStyle] = None,
        language: str = "en"
    ) -> List[SubtitleSegment]:
        """Generate subtitles from video using Groq Whisper."""
        import json as json_lib
        
        if default_style is None:
            default_style = SubtitleStyle()
        
        # Get video duration first
        video_duration = 30.0
        try:
            cmd = [
                settings.ffprobe_binary,
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                data = json_lib.loads(result.stdout)
                video_duration = float(data.get("format", {}).get("duration", 30))
                print(f"📎 Video duration: {video_duration:.1f}s")
        except Exception as e:
            print(f"⚠️ Could not get duration: {e}")
        
        # Extract audio from video
        audio_path = settings.TEMP_DIR / f"{video_id}_audio.mp3"
        
        try:
            extract_cmd = [
                settings.ffmpeg_binary, "-y",
                "-i", video_path,
                "-vn",
                "-acodec", "libmp3lame",
                "-ar", "16000",
                "-ac", "1",
                "-b:a", "64k",
                str(audio_path)
            ]
            
            result = subprocess.run(extract_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Audio extraction failed: {result.stderr}")
                return self._generate_mock_subtitles(video_path, default_style)
                
        except Exception as e:
            print(f"Audio extraction error: {e}")
            return self._generate_mock_subtitles(video_path, default_style)
        
        # Use Groq Whisper API (whisper-large-v3)
        if settings.GROQ_API_KEY:
            try:
                subtitles = await self._generate_with_groq(str(audio_path), default_style, video_duration, language)
                self._cleanup_audio(audio_path)
                if subtitles:
                    return subtitles
            except Exception as e:
                print(f"Groq transcription error: {e}")
                import traceback
                traceback.print_exc()
                self._cleanup_audio(audio_path)
        
        # Fallback to mock
        self._cleanup_audio(audio_path)
        return self._generate_mock_subtitles(video_path, default_style)
    
    def _cleanup_audio(self, audio_path: Path):
        """Clean up temporary audio file."""
        try:
            if audio_path.exists():
                os.remove(audio_path)
        except:
            pass
    
    async def _generate_with_groq(
        self,
        audio_path: str,
        default_style: SubtitleStyle,
        video_duration: float = 30.0,
        language: str = "en"
    ) -> List[SubtitleSegment]:
        """Generate subtitles using Groq Whisper API (whisper-large-v3)."""
        from groq import Groq
        import re
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        print(f"🎤 Transcribing with Groq whisper-large-v3 (Language: {language})...")
        print(f"📊 Video duration: {video_duration:.1f}s")
        
        try:
            # Use specified language
            with open(audio_path, "rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=audio_file,
                    response_format="verbose_json",
                    language=language  # Use requested language
                )
            
            print(f"📊 Response received. Text length: {len(response.text) if hasattr(response, 'text') else 0}")
            
            subtitles = []
            
            # Check if we have segments
            segments = getattr(response, 'segments', None)
            print(f"📊 Segments available: {segments is not None}")
            print(f"📊 Segments count: {len(segments) if segments else 0}")
            
            if segments and len(segments) > 0:
                print(f"📝 Processing {len(segments)} segments from Whisper...")
                
                for i, segment in enumerate(segments):
                    # Handle both dict and object
                    if isinstance(segment, dict):
                        start = float(segment.get('start', 0))
                        end = float(segment.get('end', 0))
                        text = segment.get('text', '').strip()
                    else:
                        start = float(getattr(segment, 'start', 0))
                        end = float(getattr(segment, 'end', 0))
                        text = getattr(segment, 'text', '').strip()
                    
                    if text:
                        print(f"   ✓ Segment {i}: {start:.1f}s-{end:.1f}s: {text[:40]}...")
                        subtitle = SubtitleSegment(
                            start_time=start,
                            end_time=end,
                            text=text,
                            style=default_style.model_copy()
                        )
                        subtitles.append(subtitle)
            
            else:
                # Fallback: No segments, create from full text
                full_text = (response.text if hasattr(response, 'text') else "").strip()
                print(f"⚠️ No segments, creating from full text ({len(full_text)} chars)")
                
                if full_text:
                    # Split into sentences/phrases
                    chunks = re.split(r'(?<=[.!?])\s+', full_text)
                    
                    # If still one chunk, split by commas or every 8 words
                    if len(chunks) <= 1:
                        words = full_text.split()
                        chunks = []
                        current = []
                        for word in words:
                            current.append(word)
                            if len(current) >= 6 or word.endswith(','):
                                chunks.append(' '.join(current).strip().rstrip(','))
                                current = []
                        if current:
                            chunks.append(' '.join(current).strip())
                    
                    # Calculate timing based on actual video duration
                    total_words = len(full_text.split())
                    if total_words > 0:
                        seconds_per_word = video_duration / total_words
                    else:
                        seconds_per_word = 0.5
                    
                    current_time = 0.3
                    for chunk in chunks:
                        chunk = chunk.strip()
                        if chunk:
                            word_count = len(chunk.split())
                            duration = max(1.5, min(word_count * seconds_per_word, video_duration / 2))
                            
                            # Ensure we don't exceed video duration
                            if current_time + duration > video_duration:
                                duration = video_duration - current_time - 0.5
                                if duration <= 0:
                                    break
                            
                            subtitle = SubtitleSegment(
                                start_time=current_time,
                                end_time=current_time + duration,
                                text=chunk,
                                style=default_style.model_copy()
                            )
                            subtitles.append(subtitle)
                            print(f"   Created: {current_time:.1f}s-{current_time+duration:.1f}s: {chunk[:30]}...")
                            current_time += duration + 0.3
            
            print(f"✅ Generated {len(subtitles)} subtitle segments")
            return subtitles
            
        except Exception as e:
            print(f"❌ Groq error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _generate_mock_subtitles(
        self,
        video_path: str,
        default_style: SubtitleStyle
    ) -> List[SubtitleSegment]:
        """Generate mock subtitles for demo."""
        import json as json_lib
        
        # Get video duration
        try:
            cmd = [
                settings.ffprobe_binary,
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            data = json_lib.loads(result.stdout)
            duration = float(data.get("format", {}).get("duration", 30))
        except:
            duration = 30.0
        
        print(f"⚠️ Using mock subtitles (duration: {duration:.1f}s)")
        
        subtitles = []
        
        # First segment
        style1 = default_style.model_copy()
        style1.font_size = 24
        subtitles.append(SubtitleSegment(
            start_time=1.0,
            end_time=min(duration * 0.3, 8.0),
            text="This is the first subtitle segment.",
            style=style1
        ))
        
        # Second segment
        style2 = default_style.model_copy()
        style2.font_size = 24
        subtitles.append(SubtitleSegment(
            start_time=max(duration * 0.35, 3.0),
            end_time=min(duration * 0.6, 15.0),
            text="This is the second subtitle segment.",
            style=style2
        ))
        
        # Third segment
        if duration > 10:
            style3 = default_style.model_copy()
            style3.font_size = 24
            subtitles.append(SubtitleSegment(
                start_time=max(duration * 0.65, 8.0),
                end_time=duration - 1.0,
                text="This is the third subtitle segment.",
                style=style3
            ))
        
        return subtitles
    
    def update_subtitle_style(
        self,
        subtitle: SubtitleSegment,
        style_updates: dict
    ) -> SubtitleSegment:
        """Update subtitle styling."""
        current_style = subtitle.style.model_dump()
        current_style.update(style_updates)
        subtitle.style = SubtitleStyle(**current_style)
        return subtitle
    
    def format_subtitles_for_display(
        self,
        subtitles: List[SubtitleSegment]
    ) -> str:
        """Format subtitles for display."""
        if not subtitles:
            return "No subtitles generated yet."
        
        lines = []
        for i, sub in enumerate(subtitles, 1):
            time_range = f"{sub.start_time:.1f}s - {sub.end_time:.1f}s"
            style_info = f"(size: {sub.style.font_size}px, color: {sub.style.font_color})"
            lines.append(f"{i}. [{time_range}] \"{sub.text}\" {style_info}")
        
        return "\n".join(lines)
    
    async def translate_subtitles(
        self,
        subtitles: List[SubtitleSegment],
        target_language: str = "Hindi"
    ) -> List[SubtitleSegment]:
        """Translate subtitles to another language using Groq LLM."""
        if not settings.GROQ_API_KEY:
            print("⚠️ No Groq API key for translation")
            return subtitles
        
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Batch translate for efficiency and context
            all_texts = [sub.text for sub in subtitles]
            texts_numbered = "\n".join([f"{i+1}. {text}" for i, text in enumerate(all_texts)])
            
            # Better translation prompt
            system_prompt = f"""You are an expert translator specializing in {target_language}. 
Translate the following numbered subtitle texts to {target_language}.

IMPORTANT RULES:
1. Translate naturally - use common, everyday {target_language} expressions
2. Keep the same meaning and tone as the original
3. Use proper {target_language} script (e.g., Devanagari for Hindi, Kanji/Hiragana for Japanese)
4. Keep translations concise - suitable for video subtitles
5. Return ONLY the numbered translations in the SAME format, nothing else
6. Do NOT add explanations or notes

Example format:
1. [translated text 1]
2. [translated text 2]
..."""

            response = client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": texts_numbered}
                ],
                temperature=0.2,  # Lower temperature for more accurate translations
                max_tokens=2000
            )
            
            translated_content = response.choices[0].message.content.strip()
            
            # Parse the numbered translations
            translated_texts = []
            for line in translated_content.split("\n"):
                line = line.strip()
                if line and line[0].isdigit():
                    # Remove the number prefix (e.g., "1. ", "2. ")
                    parts = line.split(". ", 1)
                    if len(parts) > 1:
                        translated_texts.append(parts[1])
                    else:
                        translated_texts.append(line)
            
            # Create translated subtitles
            translated_subtitles = []
            for i, sub in enumerate(subtitles):
                text = translated_texts[i] if i < len(translated_texts) else sub.text
                new_sub = SubtitleSegment(
                    id=sub.id,
                    start_time=sub.start_time,
                    end_time=sub.end_time,
                    text=text,
                    style=sub.style.model_copy()
                )
                translated_subtitles.append(new_sub)
            
            print(f"✅ Translated {len(translated_subtitles)} subtitles to {target_language}")
            return translated_subtitles
            
        except Exception as e:
            print(f"Translation error: {e}")
            return subtitles


# Supported languages
SUPPORTED_LANGUAGES = [
    "Hindi", "Spanish", "French", "German", "Chinese", 
    "Japanese", "Korean", "Portuguese", "Italian", "Russian",
    "Arabic", "Tamil", "Telugu", "Bengali", "Marathi"
]


# Singleton instance
subtitle_service = SubtitleService()


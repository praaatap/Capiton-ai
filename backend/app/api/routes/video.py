"""Video API routes."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path

from app.config import get_settings
from app.models.video import (
    VideoUploadResponse, VideoExportRequest, VideoExportResponse,
    VideoStatus, TrimSilenceRequest, TrimSilenceResponse, Video,
    TransformToLandscapeRequest, TransformToLandscapeResponse,
    AudioEnhanceRequest, AudioEnhanceResponse,
    ViralClipsRequest, ViralClipsResponse
)
from app.services.video_service import video_service

settings = get_settings()
router = APIRouter(prefix="/video", tags=["Video"])


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file."""
    # Validate file extension
    extension = Path(file.filename).suffix.lower()
    if extension not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_VIDEO_EXTENSIONS}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > settings.MAX_VIDEO_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_VIDEO_SIZE_MB}MB"
        )
    
    # Save video
    video = await video_service.save_uploaded_video(content, file.filename)
    
    return VideoUploadResponse(
        id=video.id,
        filename=video.filename,
        status=video.status,
        message="Video uploaded successfully"
    )


@router.get("/list")
async def list_videos():
    """List all videos."""
    videos = await video_service.list_videos()
    return {"videos": [v.model_dump() for v in videos]}


@router.get("/{video_id}")
async def get_video(video_id: str):
    """Get video metadata."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return video.model_dump()


@router.get("/{video_id}/stream")
async def stream_video(video_id: str):
    """Stream video file."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = video_service.get_video_path(video)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=video.original_filename
    )


@router.get("/{video_id}/download")
async def download_video(video_id: str):
    """Download original video file."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = video_service.get_video_path(video)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=video.original_filename,
        headers={"Content-Disposition": f"attachment; filename={video.original_filename}"}
    )


@router.post("/{video_id}/export", response_model=VideoExportResponse)
async def export_video(video_id: str, request: VideoExportRequest):
    """Export video with burned-in subtitles."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        export_path = await video_service.export_with_subtitles(
            video_id,
            request.output_format
        )
        
        return VideoExportResponse(
            id=video_id,
            status=VideoStatus.EXPORTED,
            export_path=export_path,
            message="Video exported successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/export/download")
async def download_exported_video(video_id: str):
    """Download exported video file."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.exported_path:
        raise HTTPException(status_code=404, detail="Video not yet exported")
    
    export_path = Path(video.exported_path)
    if not export_path.exists():
        raise HTTPException(status_code=404, detail="Exported file not found")
    
    return FileResponse(
        path=str(export_path),
        media_type="video/mp4",
        filename=f"{video.original_filename.rsplit('.', 1)[0]}_exported.mp4",
        headers={"Content-Disposition": f"attachment; filename={video.original_filename.rsplit('.', 1)[0]}_exported.mp4"}
    )


@router.post("/{video_id}/trim-silence", response_model=TrimSilenceResponse)
async def trim_silence(video_id: str, request: TrimSilenceRequest):
    """Auto-trim silent portions from video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        original_duration, new_duration, segments_removed = await video_service.trim_silence(
            video_id,
            request.silence_threshold,
            request.min_silence_duration,
            request.padding
        )
        
        return TrimSilenceResponse(
            id=video_id,
            original_duration=original_duration,
            new_duration=new_duration,
            segments_removed=segments_removed,
            message=f"Removed {segments_removed} silent segments. Duration: {original_duration:.1f}s -> {new_duration:.1f}s"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{video_id}")
async def delete_video(video_id: str):
    """Delete a video and its files."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        await video_service.delete_video(video_id)
        return {"id": video_id, "message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{video_id}/transform-landscape", response_model=TransformToLandscapeResponse)
async def transform_to_landscape(video_id: str, request: TransformToLandscapeRequest):
    """
    Transform a portrait/vertical video to landscape format.
    Useful for Instagram reels and other vertical videos to ensure
    captions are not cut off when displayed.
    """
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if video is already landscape
    if video.metadata and video.metadata.width >= video.metadata.height:
        return TransformToLandscapeResponse(
            id=video_id,
            original_width=video.metadata.width,
            original_height=video.metadata.height,
            new_width=video.metadata.width,
            new_height=video.metadata.height,
            message="Video is already in landscape format"
        )
    
    try:
        original_w, original_h, new_w, new_h = await video_service.transform_to_landscape(
            video_id,
            request.target_width,
            request.target_height,
            request.background_blur
        )
        
        return TransformToLandscapeResponse(
            id=video_id,
            original_width=original_w,
            original_height=original_h,
            new_width=new_w,
            new_height=new_h,
            message=f"Video transformed from {original_w}x{original_h} to {new_w}x{new_h}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/is-portrait")
async def check_is_portrait(video_id: str):
    """Check if the video is in portrait/vertical orientation."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    is_portrait = video_service.is_portrait_video(video)
    return {
        "id": video_id,
        "is_portrait": is_portrait,
        "width": video.metadata.width if video.metadata else 0,
        "height": video.metadata.height if video.metadata else 0
    }


@router.post("/{video_id}/enhance-audio", response_model=AudioEnhanceResponse)
async def enhance_audio(video_id: str, request: AudioEnhanceRequest):
    """Enhance video audio (denoise, normalize)."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        await video_service.enhance_audio(
            video_id,
            request.denoise,
            request.normalize
        )
        
        return AudioEnhanceResponse(
            id=video_id,
            status=VideoStatus.READY,
            message="Audio enhanced successfully. Background noise reduced and levels normalized."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{video_id}/generate-viral-clips", response_model=ViralClipsResponse)
async def generate_viral_clips(video_id: str, request: ViralClipsRequest):
    """AI analysis to find and generate viral clips from the video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    try:
        clips = await video_service.generate_viral_clips(
            video_id,
            request.count,
            request.duration_secs
        )
        
        return ViralClipsResponse(
            id=video_id,
            clips=clips,
            message=f"Success! Generated {len(clips)} viral clips based on AI analysis."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""Subtitle API routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.models.video import SubtitleSegment, SubtitleStyle
from app.services.video_service import video_service
from app.services.subtitle_service import subtitle_service

router = APIRouter(prefix="/subtitle", tags=["Subtitle"])


class GenerateSubtitlesRequest(BaseModel):
    """Request for subtitle generation."""
    default_style: Optional[SubtitleStyle] = None
    language: str = "en"  # Language code (e.g., en, hi, es)


class UpdateSubtitleRequest(BaseModel):
    """Request to update a specific subtitle."""
    segment_id: str
    text: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    style: Optional[SubtitleStyle] = None


class BulkStyleUpdateRequest(BaseModel):
    """Request to update style for multiple subtitles."""
    segment_ids: Optional[List[str]] = None  # None means all
    style_updates: dict


@router.post("/generate/{video_id}")
async def generate_subtitles(video_id: str, request: GenerateSubtitlesRequest = None):
    """Generate subtitles for a video using speech-to-text."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = video_service.get_video_path(video)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    try:
        default_style = request.default_style if request else None
        language = request.language if request else "en"
        
        subtitles = await subtitle_service.generate_subtitles(
            str(video_path),
            video_id,
            default_style,
            language
        )
        
        # Update video with subtitles
        video.subtitles = subtitles
        await video_service.update_video(video)
        
        return {
            "video_id": video_id,
            "subtitles_count": len(subtitles),
            "subtitles": [sub.model_dump() for sub in subtitles],
            "message": f"Generated {len(subtitles)} subtitle segments"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}")
async def get_subtitles(video_id: str):
    """Get current subtitles for a video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {
        "video_id": video_id,
        "subtitles": [sub.model_dump() for sub in video.subtitles],
        "formatted": subtitle_service.format_subtitles_for_display(video.subtitles)
    }


@router.put("/{video_id}")
async def update_subtitle(video_id: str, request: UpdateSubtitleRequest):
    """Update a specific subtitle segment."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Find the subtitle
    subtitle_index = None
    for i, sub in enumerate(video.subtitles):
        if sub.id == request.segment_id:
            subtitle_index = i
            break
    
    if subtitle_index is None:
        raise HTTPException(status_code=404, detail="Subtitle segment not found")
    
    # Update fields
    subtitle = video.subtitles[subtitle_index]
    if request.text is not None:
        subtitle.text = request.text
    if request.start_time is not None:
        subtitle.start_time = request.start_time
    if request.end_time is not None:
        subtitle.end_time = request.end_time
    if request.style is not None:
        subtitle.style = request.style
    
    video.subtitles[subtitle_index] = subtitle
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "updated_subtitle": subtitle.model_dump(),
        "message": "Subtitle updated successfully"
    }


@router.put("/{video_id}/style")
async def update_subtitles_style(video_id: str, request: BulkStyleUpdateRequest):
    """Update style for multiple subtitle segments."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    updated_count = 0
    
    for i, subtitle in enumerate(video.subtitles):
        # Check if this subtitle should be updated
        should_update = (
            request.segment_ids is None or 
            subtitle.id in request.segment_ids
        )
        
        if should_update:
            video.subtitles[i] = subtitle_service.update_subtitle_style(
                subtitle,
                request.style_updates
            )
            updated_count += 1
    
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "updated_count": updated_count,
        "subtitles": [sub.model_dump() for sub in video.subtitles],
        "message": f"Updated {updated_count} subtitle(s)"
    }


@router.post("/{video_id}/add")
async def add_subtitle(video_id: str, subtitle: SubtitleSegment):
    """Add a new subtitle segment."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video.subtitles.append(subtitle)
    # Sort by start time
    video.subtitles.sort(key=lambda x: x.start_time)
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "added_subtitle": subtitle.model_dump(),
        "total_subtitles": len(video.subtitles),
        "message": "Subtitle added successfully"
    }


@router.delete("/{video_id}/{segment_id}")
async def delete_subtitle(video_id: str, segment_id: str):
    """Delete a subtitle segment."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    original_count = len(video.subtitles)
    video.subtitles = [sub for sub in video.subtitles if sub.id != segment_id]
    
    if len(video.subtitles) == original_count:
        raise HTTPException(status_code=404, detail="Subtitle segment not found")
    
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "deleted_segment_id": segment_id,
        "remaining_subtitles": len(video.subtitles),
        "message": "Subtitle deleted successfully"
    }


class ShiftSubtitlesRequest(BaseModel):
    """Request to shift all subtitles by a time offset."""
    time_offset: float  # Seconds (positive or negative)


class MergeSubtitlesRequest(BaseModel):
    """Request to merge two subtitle segments."""
    segment_id_1: str
    segment_id_2: str
    separator: str = " "


@router.post("/{video_id}/shift")
async def shift_subtitles(video_id: str, request: ShiftSubtitlesRequest):
    """Shift all subtitles by a specific time (synchronization)."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.subtitles:
        raise HTTPException(status_code=400, detail="No subtitles to shift")
    
    offset = request.time_offset
    max_duration = video.metadata.duration if video.metadata else 3600.0
    
    updated_count = 0
    valid_subtitles = []
    
    for sub in video.subtitles:
        new_start = sub.start_time + offset
        new_end = sub.end_time + offset
        
        # Ensure valid times
        if new_end > 0 and new_start < max_duration:
            sub.start_time = max(0.0, new_start)
            sub.end_time = min(max_duration, new_end)
            valid_subtitles.append(sub)
            updated_count += 1
            
    video.subtitles = valid_subtitles
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "shift_offset": offset,
        "updated_count": updated_count,
        "message": f"Shifted {updated_count} subtitles by {offset}s"
    }


@router.post("/{video_id}/merge")
async def merge_subtitles(video_id: str, request: MergeSubtitlesRequest):
    """Merge two subtitle segments into one."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # optimize lookup
    sub_map = {s.id: i for i, s in enumerate(video.subtitles)}
    
    if request.segment_id_1 not in sub_map or request.segment_id_2 not in sub_map:
        raise HTTPException(status_code=404, detail="One or both subtitle segments not found")
    
    idx1 = sub_map[request.segment_id_1]
    idx2 = sub_map[request.segment_id_2]
    
    # Ensure order
    if idx1 > idx2:
        idx1, idx2 = idx2, idx1
        
    sub1 = video.subtitles[idx1]
    sub2 = video.subtitles[idx2]
    
    # Create merged segment
    merged_sub = SubtitleSegment(
        id=sub1.id, # Keep ID of first
        start_time=min(sub1.start_time, sub2.start_time),
        end_time=max(sub1.end_time, sub2.end_time),
        text=f"{sub1.text}{request.separator}{sub2.text}",
        style=sub1.style # Inherit style from first
    )
    
    # Remove old ones and insert new
    # Remove higher index first to not shift lower index
    video.subtitles.pop(idx2)
    video.subtitles.pop(idx1)
    
    # Insert at idx1
    video.subtitles.insert(idx1, merged_sub)
    
    await video_service.update_video(video)
    
    return {
        "video_id": video_id,
        "merged_segment": merged_sub.model_dump(),
        "message": "Subtitles merged successfully"
    }


class TranslateRequest(BaseModel):
    """Request for subtitle translation."""
    target_language: str = "Hindi"


@router.post("/{video_id}/translate")
async def translate_subtitles(video_id: str, request: TranslateRequest):
    """Translate subtitles to another language."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if not video.subtitles:
        raise HTTPException(status_code=400, detail="No subtitles to translate")
    
    try:
        translated = await subtitle_service.translate_subtitles(
            video.subtitles,
            request.target_language
        )
        
        video.subtitles = translated
        await video_service.update_video(video)
        
        return {
            "video_id": video_id,
            "target_language": request.target_language,
            "subtitles_count": len(translated),
            "subtitles": [sub.model_dump() for sub in translated],
            "message": f"Translated {len(translated)} subtitles to {request.target_language}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported translation languages."""
    from app.services.subtitle_service import SUPPORTED_LANGUAGES
    return {
        "languages": SUPPORTED_LANGUAGES
    }


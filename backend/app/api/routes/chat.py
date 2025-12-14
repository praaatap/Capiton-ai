"""Chat API routes for LLM-based editing."""
from fastapi import APIRouter, HTTPException
from typing import List

from app.models.chat import ChatRequest, ChatResponse, ChatMessage
from app.services.video_service import video_service
from app.services.llm_service import llm_service
from app.services.cache_service import cache_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/{video_id}", response_model=ChatResponse)
async def process_chat(video_id: str, request: ChatRequest):
    """Process a chat message for video editing."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        response = await llm_service.process_chat(
            video_id,
            request.message,
            video.subtitles
        )
        
        # Apply edits to video subtitles
        if response.edits:
            for edit in response.edits:
                if edit.action == "style" and edit.segment_id is not None:
                    try:
                        idx = int(edit.segment_id)
                        if 0 <= idx < len(video.subtitles):
                            if edit.style_changes:
                                current_style = video.subtitles[idx].style.model_dump()
                                current_style.update(edit.style_changes)
                                from app.models.video import SubtitleStyle
                                video.subtitles[idx].style = SubtitleStyle(**current_style)
                    except (ValueError, IndexError):
                        pass
                
                elif edit.action == "modify" and edit.segment_id is not None:
                    try:
                        idx = int(edit.segment_id)
                        if 0 <= idx < len(video.subtitles):
                            if edit.text:
                                video.subtitles[idx].text = edit.text
                            if edit.start_time is not None:
                                video.subtitles[idx].start_time = edit.start_time
                            if edit.end_time is not None:
                                video.subtitles[idx].end_time = edit.end_time
                            if edit.style_changes:
                                current_style = video.subtitles[idx].style.model_dump()
                                current_style.update(edit.style_changes)
                                from app.models.video import SubtitleStyle
                                video.subtitles[idx].style = SubtitleStyle(**current_style)
                    except (ValueError, IndexError):
                        pass
                
                elif edit.action == "add":
                    from app.models.video import SubtitleSegment, SubtitleStyle
                    new_sub = SubtitleSegment(
                        start_time=edit.start_time or 0,
                        end_time=edit.end_time or 3,
                        text=edit.text or "",
                        style=SubtitleStyle(**(edit.style_changes or {}))
                    )
                    video.subtitles.append(new_sub)
                
                elif edit.action == "delete" and edit.segment_id is not None:
                    try:
                        idx = int(edit.segment_id)
                        if 0 <= idx < len(video.subtitles):
                            video.subtitles.pop(idx)
                    except (ValueError, IndexError):
                        pass
            
            # Save updated video
            await video_service.update_video(video)
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{video_id}/history")
async def get_chat_history(video_id: str):
    """Get chat history for a video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    history = await cache_service.get_chat_history(video_id)
    
    return {
        "video_id": video_id,
        "messages": history or [],
        "count": len(history) if history else 0
    }


@router.delete("/{video_id}/history")
async def clear_chat_history(video_id: str):
    """Clear chat history for a video."""
    video = await video_service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await cache_service.clear_chat_history(video_id)
    
    return {
        "video_id": video_id,
        "message": "Chat history cleared"
    }

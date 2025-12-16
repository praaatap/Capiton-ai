"""Pydantic models for video data."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class VideoStatus(str, Enum):
    """Video processing status."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    EXPORTING = "exporting"
    EXPORTED = "exported"
    ERROR = "error"


class SubtitleStyle(BaseModel):
    """Subtitle styling configuration."""
    font_family: str = "Arial"
    font_size: int = 24
    font_color: str = "#FFFFFF"
    outline_color: str = "#000000"
    outline_width: int = 2
    position: str = "bottom"  # top, center, bottom
    bold: bool = False
    italic: bool = False


class SubtitleSegment(BaseModel):
    """Individual subtitle segment."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    start_time: float  # seconds
    end_time: float  # seconds
    text: str
    style: SubtitleStyle = Field(default_factory=SubtitleStyle)


class VideoMetadata(BaseModel):
    """Video file metadata."""
    duration: float  # seconds
    width: int
    height: int
    fps: float
    file_size: int  # bytes
    format: str


class Video(BaseModel):
    """Video data model."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    status: VideoStatus = VideoStatus.UPLOADED
    metadata: Optional[VideoMetadata] = None
    subtitles: List[SubtitleSegment] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    exported_path: Optional[str] = None


class VideoUploadResponse(BaseModel):
    """Response after video upload."""
    id: str
    filename: str
    status: VideoStatus
    message: str


class VideoExportRequest(BaseModel):
    """Request for video export."""
    burn_subtitles: bool = True
    output_format: str = "mp4"


class VideoExportResponse(BaseModel):
    """Response after video export."""
    id: str
    status: VideoStatus
    export_path: Optional[str] = None
    message: str


class TrimSilenceRequest(BaseModel):
    """Request for silence trimming."""
    silence_threshold: float = -40  # dB
    min_silence_duration: float = 0.5  # seconds
    padding: float = 0.1  # seconds to keep around speech


class TrimSilenceResponse(BaseModel):
    """Response after silence trimming."""
    id: str
    original_duration: float
    new_duration: float
    segments_removed: int
    message: str


class TransformToLandscapeRequest(BaseModel):
    """Request for portrait to landscape transformation."""
    target_width: int = 1920  # Default to 1080p
    target_height: int = 1080
    background_blur: bool = True  # Blur background for portrait in landscape
    background_color: str = "#000000"  # Fallback background color


class TransformToLandscapeResponse(BaseModel):
    """Response after landscape transformation."""
    id: str
    original_width: int
    original_height: int
    new_width: int
    new_height: int
    message: str


class AudioEnhanceRequest(BaseModel):
    """Request for audio enhancements."""
    denoise: bool = True
    normalize: bool = True
    remove_clicks: bool = True


class AudioEnhanceResponse(BaseModel):
    """Response after audio enhancement."""
    id: str
    status: VideoStatus
    message: str


class ViralClipsRequest(BaseModel):
    """Request to generate viral short clips."""
    count: int = 3
    duration_secs: int = 30
    focus_topic: Optional[str] = None


class ViralClip(BaseModel):
    """Details of a generated viral clip."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    start_time: float
    end_time: float
    score: float  # Virality score 0-1
    summary: str


class ViralClipsResponse(BaseModel):
    """Response with generated clips."""
    id: str
    clips: List[ViralClip]
    message: str

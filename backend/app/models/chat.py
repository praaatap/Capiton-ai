"""Pydantic models for chat interactions."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class MessageRole(str, Enum):
    """Chat message role."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """Individual chat message."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Request to process a chat message."""
    message: str
    video_id: str


class SubtitleEdit(BaseModel):
    """Subtitle edit action extracted from chat."""
    action: str  # "add", "modify", "delete", "style"
    segment_id: Optional[str] = None
    text: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    style_changes: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response from chat processing."""
    message: str
    edits: List[SubtitleEdit] = []
    success: bool = True
    video_id: str


class ChatHistory(BaseModel):
    """Full chat history for a video."""
    video_id: str
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

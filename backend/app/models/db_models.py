"""SQLAlchemy database models."""
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    image = Column(String(500), nullable=True)
    provider = Column(String(50), default="credentials")  # google, credentials
    provider_id = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)  # For email/password auth
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    videos = relationship("VideoRecord", back_populates="user", cascade="all, delete-orphan")


class VideoRecord(Base):
    """Video record for database storage."""
    __tablename__ = "videos"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # File info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(500), nullable=True)  # R2 storage key
    file_size = Column(Integer, default=0)
    
    # Metadata
    duration = Column(Float, default=0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    fps = Column(Float, default=0)
    codec = Column(String(50), nullable=True)
    
    # Status
    status = Column(String(50), default="uploaded")  # uploaded, processing, ready, exported
    exported_path = Column(String(500), nullable=True)
    
    # Subtitles (stored as JSON)
    subtitles = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="videos")


class ChatMessage(Base):
    """Chat message history."""
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    video_id = Column(String(36), ForeignKey("videos.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

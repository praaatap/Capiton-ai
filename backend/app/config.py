"""Application configuration settings."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Settings
    APP_NAME: str = "Chat Video Editor"
    DEBUG: bool = True
    API_PREFIX: str = "/api"
    
    # OpenAI Settings
    OPENAI_API_KEY: str = ""
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    
    # Groq Settings (Free LLM API - get key at console.groq.com)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-70b-versatile"  # or mixtral-8x7b-32768
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./subtitle_ai.db"  # PostgreSQL for production
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production-to-random-string"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Cloudflare R2 Storage
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "subtitle-ai-videos"
    R2_PUBLIC_DOMAIN: str = ""  # e.g., cdn.yourdomain.com
    
    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour
    
    # File Storage
    BASE_DIR: Path = Path(__file__).parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    EXPORT_DIR: Path = BASE_DIR / "exports"
    TEMP_DIR: Path = BASE_DIR / "temp"
    
    # Video Settings
    MAX_VIDEO_SIZE_MB: int = 500
    ALLOWED_VIDEO_EXTENSIONS: list = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    
    # Subtitle Defaults
    DEFAULT_FONT: str = "Arial"
    DEFAULT_FONT_SIZE: int = 24
    DEFAULT_FONT_COLOR: str = "#FFFFFF"
    DEFAULT_OUTLINE_COLOR: str = "#000000"
    DEFAULT_OUTLINE_WIDTH: int = 2
    DEFAULT_POSITION: str = "bottom"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

    @property
    def ffmpeg_binary(self) -> str:
        """Get FFmpeg binary path."""
        try:
            import imageio_ffmpeg
            return imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            return "ffmpeg"

    @property
    def ffprobe_binary(self) -> str:
        """Get FFprobe binary path."""
        try:
            import imageio_ffmpeg
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
            # ffprobe is usually in the same directory as ffmpeg
            from pathlib import Path
            ffprobe_path = Path(ffmpeg_path).parent / "ffprobe.exe"
            if ffprobe_path.exists():
                return str(ffprobe_path)
            # Try without .exe for unix
            ffprobe_path = Path(ffmpeg_path).parent / "ffprobe"
            if ffprobe_path.exists():
                return str(ffprobe_path)
        except ImportError:
            pass
        return "ffprobe"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    from pathlib import Path
    import os
    
    # Try to load from .env first, then .env.example
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    env_example = backend_dir / ".env.example"
    
    if env_file.exists():
        settings = Settings(_env_file=str(env_file))
    elif env_example.exists():
        print("⚠️ Using .env.example (create .env for production)")
        settings = Settings(_env_file=str(env_example))
    else:
        settings = Settings()
    
    # Also check environment variables directly
    if not settings.GROQ_API_KEY and os.environ.get("GROQ_API_KEY"):
        settings.GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    
    # Print status
    if settings.GROQ_API_KEY:
        print(f"✅ Groq API Key loaded ({settings.GROQ_MODEL})")
    elif settings.OPENAI_API_KEY:
        print("✅ OpenAI API Key loaded")
    else:
        print("⚠️ No API keys found - using mock mode")
        print("   Get free Groq key at: https://console.groq.com")
    
    # Ensure directories exist
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    return settings

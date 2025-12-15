"""FastAPI main application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.config import get_settings
from app.api.routes import video, subtitle, chat, auth, user, templates, analytics, notifications
from app.services.cache_service import cache_service
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    # Initialize database
    init_db()
    
    # Connect to Redis
    await cache_service.connect()
    print("✅ Connected to Redis")
    yield
    # Shutdown
    await cache_service.disconnect()
    print("👋 Disconnected from Redis")


app = FastAPI(
    title=settings.APP_NAME,
    description="Chat-based video editor with AI-powered subtitle generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads and exports
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/exports", StaticFiles(directory=str(settings.EXPORT_DIR)), name="exports")

# Include routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(video.router, prefix=settings.API_PREFIX)
app.include_router(subtitle.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)
app.include_router(user.router)
app.include_router(templates.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


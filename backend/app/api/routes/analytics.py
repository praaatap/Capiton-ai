"""
Analytics API routes
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# --- Pydantic Models ---

class TimeSeriesData(BaseModel):
    date: str
    value: float


class StatCard(BaseModel):
    title: str
    value: str
    change: float  # Percentage change
    trend: str  # up, down, stable


class LanguageStats(BaseModel):
    language: str
    count: int
    percentage: float


class RecentExport(BaseModel):
    id: str
    filename: str
    duration: str
    size: str
    exported_at: str


class AnalyticsDashboard(BaseModel):
    stats: List[StatCard]
    activity: List[TimeSeriesData]
    languages: List[LanguageStats]
    recent_exports: List[RecentExport]


# --- Helper Functions ---

def generate_mock_activity(days: int) -> List[TimeSeriesData]:
    """Generate mock activity data for the specified number of days"""
    data = []
    base_date = datetime.utcnow() - timedelta(days=days)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        value = random.randint(20, 100)
        data.append(TimeSeriesData(
            date=date.strftime("%Y-%m-%d"),
            value=value
        ))
    
    return data


# --- Routes ---

@router.get("/dashboard")
async def get_dashboard(time_range: str = "30d"):
    """Get analytics dashboard data"""
    
    # Parse time range
    days = 30
    if time_range == "7d":
        days = 7
    elif time_range == "90d":
        days = 90
    
    # Stats cards
    stats = [
        StatCard(title="Total Videos", value="24", change=12.5, trend="up"),
        StatCard(title="Minutes Processed", value="147", change=8.3, trend="up"),
        StatCard(title="Subtitles Generated", value="1,842", change=23.1, trend="up"),
        StatCard(title="Total Exports", value="89", change=-5.2, trend="down"),
    ]
    
    # Activity data
    activity = generate_mock_activity(days)
    
    # Language distribution
    languages = [
        LanguageStats(language="English", count=45, percentage=45.0),
        LanguageStats(language="Spanish", count=22, percentage=22.0),
        LanguageStats(language="Hindi", count=18, percentage=18.0),
        LanguageStats(language="French", count=10, percentage=10.0),
        LanguageStats(language="German", count=5, percentage=5.0),
    ]
    
    # Recent exports
    recent_exports = [
        RecentExport(
            id="exp-1", filename="Marketing_Video_Final.mp4",
            duration="3:45", size="45 MB", exported_at="2 hours ago"
        ),
        RecentExport(
            id="exp-2", filename="Product_Demo_v2.mp4",
            duration="8:22", size="128 MB", exported_at="5 hours ago"
        ),
        RecentExport(
            id="exp-3", filename="Tutorial_Basics.mp4",
            duration="12:15", size="186 MB", exported_at="Yesterday"
        ),
        RecentExport(
            id="exp-4", filename="Interview_Cut.mp4",
            duration="15:30", size="245 MB", exported_at="2 days ago"
        ),
    ]
    
    return AnalyticsDashboard(
        stats=stats,
        activity=activity,
        languages=languages,
        recent_exports=recent_exports
    )


@router.get("/videos")
async def get_video_analytics(time_range: str = "30d"):
    """Get video-specific analytics"""
    days = 30 if time_range == "30d" else (7 if time_range == "7d" else 90)
    
    return {
        "total_videos": 24,
        "videos_this_period": 8,
        "average_duration_minutes": 6.1,
        "total_duration_minutes": 147,
        "formats": {
            "mp4": 85,
            "mov": 10,
            "webm": 5
        },
        "resolutions": {
            "1080p": 60,
            "720p": 30,
            "4k": 10
        },
        "uploads_by_day": generate_mock_activity(days)
    }


@router.get("/subtitles")
async def get_subtitle_analytics(time_range: str = "30d"):
    """Get subtitle-specific analytics"""
    return {
        "total_subtitles": 1842,
        "subtitles_this_period": 423,
        "average_per_video": 76,
        "languages_used": [
            {"language": "English", "count": 845},
            {"language": "Spanish", "count": 312},
            {"language": "Hindi", "count": 256},
            {"language": "French", "count": 187},
            {"language": "German", "count": 125},
            {"language": "Japanese", "count": 67},
            {"language": "Korean", "count": 50},
        ],
        "translation_accuracy": 94.5,
        "average_generation_time_seconds": 12.3
    }


@router.get("/exports")
async def get_export_analytics(time_range: str = "30d"):
    """Get export-specific analytics"""
    return {
        "total_exports": 89,
        "exports_this_period": 23,
        "average_size_mb": 156.4,
        "total_size_gb": 13.9,
        "formats": {
            "mp4": 92,
            "webm": 8
        },
        "with_subtitles": 100,
        "average_export_time_seconds": 45.2
    }


@router.get("/usage")
async def get_usage_analytics():
    """Get usage and quota analytics"""
    return {
        "current_period": {
            "start": (datetime.utcnow().replace(day=1)).isoformat(),
            "end": datetime.utcnow().isoformat()
        },
        "videos": {
            "used": 2,
            "limit": 3,
            "percentage": 66.7
        },
        "minutes": {
            "used": 8.5,
            "limit": 15,
            "percentage": 56.7
        },
        "storage": {
            "used_gb": 0.24,
            "limit_gb": 1,
            "percentage": 24.0
        },
        "exports": {
            "used": 3,
            "limit": 5,
            "percentage": 60.0
        }
    }

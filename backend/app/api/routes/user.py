"""
User settings and preferences routes
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/user", tags=["user"])


# --- Pydantic Models ---

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    export_complete: bool = True
    weekly_digest: bool = False
    product_updates: bool = True


class PreferenceSettings(BaseModel):
    default_language: str = "en"
    default_subtitle_style: str = "default"
    auto_generate_subtitles: bool = True


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    plan: str = "free"
    created_at: str
    storage_used_mb: float = 0
    storage_limit_mb: float = 1024  # 1GB for free plan


class UsageStats(BaseModel):
    total_videos: int = 0
    total_minutes_processed: float = 0
    total_exports: int = 0
    total_subtitles_generated: int = 0
    languages_used: List[str] = []


class UserSettings(BaseModel):
    notifications: NotificationSettings
    preferences: PreferenceSettings


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    notifications: Optional[NotificationSettings] = None
    preferences: Optional[PreferenceSettings] = None


# --- In-memory storage (would use database in production) ---

user_settings_store: dict = {}
user_usage_store: dict = {}


def get_default_settings() -> UserSettings:
    return UserSettings(
        notifications=NotificationSettings(),
        preferences=PreferenceSettings()
    )


# --- Routes ---

@router.get("/profile")
async def get_user_profile():
    """Get current user profile"""
    # In production, get user from JWT token
    return UserProfile(
        id="user-123",
        name="John Doe",
        email="john@example.com",
        plan="free",
        created_at=datetime.utcnow().isoformat(),
        storage_used_mb=245.5,
        storage_limit_mb=1024
    )


@router.put("/profile")
async def update_user_profile(request: UpdateProfileRequest):
    """Update user profile"""
    return {
        "success": True,
        "message": "Profile updated successfully",
        "name": request.name,
        "email": request.email
    }


@router.get("/settings")
async def get_user_settings():
    """Get user settings"""
    # In production, get settings from database keyed by user ID
    return get_default_settings()


@router.put("/settings")
async def update_user_settings(request: UpdateSettingsRequest):
    """Update user settings"""
    current_settings = get_default_settings()
    
    if request.notifications:
        current_settings.notifications = request.notifications
    if request.preferences:
        current_settings.preferences = request.preferences
    
    # In production, save to database
    return {
        "success": True,
        "message": "Settings updated successfully",
        "settings": current_settings
    }


@router.get("/usage")
async def get_usage_stats():
    """Get user usage statistics"""
    return UsageStats(
        total_videos=24,
        total_minutes_processed=147.5,
        total_exports=89,
        total_subtitles_generated=1842,
        languages_used=["English", "Spanish", "Hindi", "French", "German"]
    )


@router.get("/subscription")
async def get_subscription():
    """Get user subscription details"""
    return {
        "plan": "free",
        "status": "active",
        "limits": {
            "videos_per_month": 3,
            "max_duration_minutes": 5,
            "storage_gb": 1,
            "exports_per_month": 5,
            "languages": 1
        },
        "usage": {
            "videos_this_month": 2,
            "exports_this_month": 3
        },
        "billing_cycle_start": datetime.utcnow().replace(day=1).isoformat(),
        "next_billing_date": None  # None for free plan
    }


@router.post("/subscription/upgrade")
async def upgrade_subscription(plan: str):
    """Initiate subscription upgrade"""
    valid_plans = ["pro", "enterprise"]
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Choose from: {valid_plans}")
    
    # In production, integrate with Stripe
    return {
        "success": True,
        "message": f"Upgrade to {plan} initiated",
        "checkout_url": f"https://checkout.stripe.com/pay/{plan}_{uuid.uuid4().hex[:8]}"
    }


@router.delete("/account")
async def delete_account():
    """Delete user account"""
    # In production, soft delete and schedule for permanent deletion
    return {
        "success": True,
        "message": "Account scheduled for deletion. You have 30 days to reactivate.",
        "deletion_date": datetime.utcnow().isoformat()
    }

"""
Notifications API routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# --- Pydantic Models ---

class Notification(BaseModel):
    id: str
    type: str  # info, success, warning, error
    category: str  # export, subtitle, system, billing
    title: str
    message: str
    read: bool = False
    action_url: Optional[str] = None
    created_at: str


class MarkReadRequest(BaseModel):
    notification_ids: List[str]


# --- In-memory storage (use database in production) ---

notifications_store: dict = {}

# Generate some sample notifications
SAMPLE_NOTIFICATIONS = [
    Notification(
        id="notif-1",
        type="success",
        category="export",
        title="Export Complete",
        message="Your video 'Marketing_Final.mp4' has been exported successfully.",
        read=False,
        action_url="/dashboard",
        created_at=datetime.utcnow().isoformat()
    ),
    Notification(
        id="notif-2",
        type="info",
        category="subtitle",
        title="Subtitles Generated",
        message="24 subtitles were created for 'Product_Demo.mp4'.",
        read=False,
        action_url="/editor/video-123",
        created_at=datetime.utcnow().isoformat()
    ),
    Notification(
        id="notif-3",
        type="warning",
        category="billing",
        title="Approaching Limit",
        message="You've used 80% of your monthly video quota.",
        read=True,
        action_url="/pricing",
        created_at=datetime.utcnow().isoformat()
    ),
    Notification(
        id="notif-4",
        type="info",
        category="system",
        title="New Feature Available",
        message="Try our new AI-powered subtitle styling feature!",
        read=True,
        action_url=None,
        created_at=datetime.utcnow().isoformat()
    ),
]


# --- Routes ---

@router.get("/", response_model=List[Notification])
async def list_notifications(unread_only: bool = False, limit: int = 50):
    """Get all notifications for current user"""
    notifs = SAMPLE_NOTIFICATIONS.copy()
    notifs.extend(notifications_store.values())
    
    if unread_only:
        notifs = [n for n in notifs if not n.read]
    
    # Sort by created_at descending
    notifs.sort(key=lambda x: x.created_at, reverse=True)
    
    return notifs[:limit]


@router.get("/unread-count")
async def get_unread_count():
    """Get count of unread notifications"""
    all_notifs = SAMPLE_NOTIFICATIONS + list(notifications_store.values())
    unread = sum(1 for n in all_notifs if not n.read)
    return {"count": unread}


@router.post("/mark-read")
async def mark_as_read(request: MarkReadRequest):
    """Mark notifications as read"""
    marked = 0
    
    for notif_id in request.notification_ids:
        # Check sample notifications
        for n in SAMPLE_NOTIFICATIONS:
            if n.id == notif_id:
                n.read = True
                marked += 1
        
        # Check custom notifications
        if notif_id in notifications_store:
            notifications_store[notif_id].read = True
            marked += 1
    
    return {"success": True, "marked_count": marked}


@router.post("/mark-all-read")
async def mark_all_as_read():
    """Mark all notifications as read"""
    for n in SAMPLE_NOTIFICATIONS:
        n.read = True
    
    for n in notifications_store.values():
        n.read = True
    
    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    # Can't delete sample notifications in this demo
    if notification_id in notifications_store:
        del notifications_store[notification_id]
        return {"success": True, "message": "Notification deleted"}
    
    raise HTTPException(status_code=404, detail="Notification not found")


@router.delete("/")
async def clear_all_notifications():
    """Clear all notifications"""
    notifications_store.clear()
    # Mark samples as read instead of deleting
    for n in SAMPLE_NOTIFICATIONS:
        n.read = True
    
    return {"success": True, "message": "All notifications cleared"}


# --- Internal function to create notifications ---

def create_notification(
    type: str,
    category: str,
    title: str,
    message: str,
    action_url: Optional[str] = None
) -> Notification:
    """Create a new notification (for internal use)"""
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:8]}",
        type=type,
        category=category,
        title=title,
        message=message,
        read=False,
        action_url=action_url,
        created_at=datetime.utcnow().isoformat()
    )
    
    notifications_store[notif.id] = notif
    return notif

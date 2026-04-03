"""
Notification endpoints for user notifications
"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import Notification, NotificationSummary
from app.services.notification import NotificationService


router = APIRouter()


@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = Query(False, description="Show only unread notifications"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user notifications"""
    service = NotificationService(db)
    return service.get_user_notifications(current_user.id, unread_only, skip, limit)


@router.get("/summary", response_model=NotificationSummary)
async def get_notification_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get notification count summary"""
    service = NotificationService(db)
    summary = service.get_notification_summary(current_user.id)
    return NotificationSummary(**summary)


@router.patch("/{notification_id}/read", response_model=Notification)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
    service = NotificationService(db)
    return service.mark_as_read(notification_id, current_user.id)


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read"""
    service = NotificationService(db)
    count = service.mark_all_as_read(current_user.id)
    return {"message": f"Marked {count} notifications as read", "count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a notification"""
    service = NotificationService(db)
    service.delete_notification(notification_id, current_user.id)
    return {"message": "Notification deleted"}

"""
Notification repository for database operations
"""
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.notification import Notification


class NotificationRepository:
    """Repository for notification data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Get notification by ID for specific user"""
        return (
            self.db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
    
    def get_all_for_user(
        self,
        user_id: int,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Notification]:
        """Get all notifications for a user"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return (
            query.order_by(desc(Notification.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def count_unread(self, user_id: int) -> int:
        """Count unread notifications for a user"""
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )
    
    def create(self, user_id: int, **kwargs) -> Notification:
        """Create a new notification"""
        notification = Notification(user_id=user_id, **kwargs)
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def update(self, notification: Notification, **kwargs) -> Notification:
        """Update notification fields"""
        for key, value in kwargs.items():
            if value is not None and hasattr(notification, key):
                setattr(notification, key, value)
        
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def mark_as_read(self, notification: Notification) -> Notification:
        """Mark notification as read"""
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        count = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True})
        )
        self.db.commit()
        return count
    
    def delete(self, notification: Notification) -> None:
        """Delete a notification"""
        self.db.delete(notification)
        self.db.commit()
    
    def delete_old_read(self, user_id: int, days: int = 30) -> int:
        """Delete read notifications older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        count = (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == True,
                Notification.created_at < cutoff_date,
            )
            .delete()
        )
        self.db.commit()
        return count

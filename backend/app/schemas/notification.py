"""
Notification schemas for request/response validation
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationBase(BaseModel):
    """Base notification schema"""
    type: str
    title: str
    message: str


class NotificationCreate(NotificationBase):
    """Schema for creating a notification"""
    pass


class NotificationUpdate(BaseModel):
    """Schema for updating a notification"""
    is_read: Optional[bool] = None


class NotificationInDB(NotificationBase):
    """Notification schema as stored in database"""
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Notification(NotificationInDB):
    """Notification schema for API responses"""
    pass


class NotificationSummary(BaseModel):
    """Summary of notification counts"""
    total: int
    unread: int

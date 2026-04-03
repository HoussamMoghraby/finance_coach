"""
Notification service for creating and managing notifications
"""
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories.notification import NotificationRepository
from app.schemas.notification import NotificationCreate, NotificationUpdate


class NotificationService:
    """Service for notification operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)
    
    def get_notification(self, notification_id: int, user_id: int) -> Notification:
        """Get notification by ID"""
        notification = self.repo.get_by_id(notification_id, user_id)
        if not notification:
            raise ValueError("Notification not found")
        return notification
    
    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Notification]:
        """Get all notifications for a user"""
        return self.repo.get_all_for_user(user_id, unread_only, skip, limit)
    
    def get_notification_summary(self, user_id: int) -> dict:
        """Get notification count summary"""
        all_notifications = self.repo.get_all_for_user(user_id, unread_only=False, limit=1000)
        unread_count = self.repo.count_unread(user_id)
        
        return {
            "total": len(all_notifications),
            "unread": unread_count,
        }
    
    def create_notification(
        self, user_id: int, notification_data: NotificationCreate
    ) -> Notification:
        """Create a new notification"""
        return self.repo.create(
            user_id=user_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
        )
    
    def mark_as_read(self, notification_id: int, user_id: int) -> Notification:
        """Mark notification as read"""
        notification = self.get_notification(notification_id, user_id)
        return self.repo.mark_as_read(notification)
    
    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        return self.repo.mark_all_as_read(user_id)
    
    def delete_notification(self, notification_id: int, user_id: int) -> None:
        """Delete a notification"""
        notification = self.get_notification(notification_id, user_id)
        self.repo.delete(notification)
    
    # Notification creation helpers for different types
    
    def create_budget_threshold_notification(
        self,
        user_id: int,
        budget_name: str,
        percentage: float,
        spent: float,
        limit: float,
    ) -> Notification:
        """Create notification for budget threshold reached"""
        title = f"Budget Alert: {budget_name}"
        message = (
            f"You've used {percentage:.1f}% of your {budget_name} budget. "
            f"Spent: ${spent:.2f} of ${limit:.2f}."
        )
        
        return self.repo.create(
            user_id=user_id,
            type="budget_threshold",
            title=title,
            message=message,
        )
    
    def create_budget_exceeded_notification(
        self,
        user_id: int,
        budget_name: str,
        spent: float,
        limit: float,
    ) -> Notification:
        """Create notification for budget exceeded"""
        over_amount = spent - limit
        title = f"Budget Exceeded: {budget_name}"
        message = (
            f"Your {budget_name} budget has been exceeded by ${over_amount:.2f}. "
            f"Spent: ${spent:.2f} of ${limit:.2f}."
        )
        
        return self.repo.create(
            user_id=user_id,
            type="budget_threshold",
            title=title,
            message=message,
        )
    
    def create_unusual_spending_notification(
        self,
        user_id: int,
        category: str,
        amount: float,
        average: float,
    ) -> Notification:
        """Create notification for unusual spending detected"""
        percentage_above = ((amount - average) / average * 100) if average > 0 else 0
        title = "Unusual Spending Detected"
        message = (
            f"Your spending in {category} is {percentage_above:.0f}% higher than usual. "
            f"Amount: ${amount:.2f}, Average: ${average:.2f}."
        )
        
        return self.repo.create(
            user_id=user_id,
            type="unusual_spending",
            title=title,
            message=message,
        )
    
    def create_summary_ready_notification(
        self,
        user_id: int,
        summary_type: str,
        period: str,
    ) -> Notification:
        """Create notification for summary ready"""
        title = f"{summary_type.title()} Summary Ready"
        message = f"Your {summary_type} financial summary for {period} is now available."
        
        return self.repo.create(
            user_id=user_id,
            type="summary_ready",
            title=title,
            message=message,
        )
    
    def create_recurring_upcoming_notification(
        self,
        user_id: int,
        description: str,
        amount: float,
        due_date: date,
    ) -> Notification:
        """Create notification for upcoming recurring payment"""
        days_until = (due_date - date.today()).days
        due_text = "today" if days_until == 0 else "tomorrow" if days_until == 1 else f"in {days_until} days"
        
        title = "Upcoming Recurring Payment"
        message = f"{description} of ${amount:.2f} is due {due_text} ({due_date.strftime('%b %d, %Y')})."
        
        return self.repo.create(
            user_id=user_id,
            type="recurring_upcoming",
            title=title,
            message=message,
        )
    
    def cleanup_old_notifications(self, user_id: int, days: int = 30) -> int:
        """Delete old read notifications"""
        return self.repo.delete_old_read(user_id, days)

"""
Recurring Transaction repository for database operations
"""
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.recurring_transaction import RecurringTransaction


class RecurringTransactionRepository:
    """Repository for recurring transaction database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, recurring_id: int, user_id: int) -> Optional[RecurringTransaction]:
        """Get recurring transaction by ID"""
        return (
            self.db.query(RecurringTransaction)
            .filter(
                RecurringTransaction.id == recurring_id,
                RecurringTransaction.user_id == user_id,
            )
            .first()
        )
    
    def get_all_for_user(
        self, user_id: int, active_only: bool = False
    ) -> List[RecurringTransaction]:
        """Get all recurring transactions for a user"""
        query = self.db.query(RecurringTransaction).filter(
            RecurringTransaction.user_id == user_id
        )
        
        if active_only:
            query = query.filter(RecurringTransaction.is_active == True)
        
        return query.order_by(RecurringTransaction.next_expected_date).all()
    
    def get_upcoming(
        self, user_id: int, before_date: date, active_only: bool = True
    ) -> List[RecurringTransaction]:
        """Get upcoming recurring transactions before a date"""
        query = self.db.query(RecurringTransaction).filter(
            RecurringTransaction.user_id == user_id,
            RecurringTransaction.next_expected_date <= before_date,
        )
        
        if active_only:
            query = query.filter(RecurringTransaction.is_active == True)
        
        return query.order_by(RecurringTransaction.next_expected_date).all()
    
    def create(self, **kwargs) -> RecurringTransaction:
        """Create a new recurring transaction"""
        recurring = RecurringTransaction(**kwargs)
        self.db.add(recurring)
        self.db.commit()
        self.db.refresh(recurring)
        return recurring
    
    def update(self, recurring: RecurringTransaction, **kwargs) -> RecurringTransaction:
        """Update a recurring transaction"""
        for key, value in kwargs.items():
            if value is not None:
                setattr(recurring, key, value)
        self.db.commit()
        self.db.refresh(recurring)
        return recurring
    
    def delete(self, recurring: RecurringTransaction) -> None:
        """Delete a recurring transaction"""
        self.db.delete(recurring)
        self.db.commit()

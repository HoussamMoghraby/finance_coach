"""
Budget repository for database operations
"""
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.budget import Budget


class BudgetRepository:
    """Repository for budget data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, budget_id: int, user_id: int) -> Optional[Budget]:
        """Get budget by ID for specific user"""
        return (
            self.db.query(Budget)
            .filter(Budget.id == budget_id, Budget.user_id == user_id)
            .first()
        )
    
    def get_all_for_user(self, user_id: int) -> List[Budget]:
        """Get all budgets for a user"""
        return self.db.query(Budget).filter(Budget.user_id == user_id).all()
    
    def get_active_budgets(
        self, user_id: int, target_date: Optional[date] = None
    ) -> List[Budget]:
        """Get all active budgets for a user at a specific date"""
        if target_date is None:
            target_date = date.today()
        
        return (
            self.db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.start_date <= target_date,
                Budget.end_date >= target_date,
            )
            .all()
        )
    
    def get_by_category(
        self, user_id: int, category_id: Optional[int], start_date: date, end_date: date
    ) -> Optional[Budget]:
        """Get budget for a specific category and date range"""
        query = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date,
        )
        
        if category_id:
            query = query.filter(Budget.category_id == category_id)
        else:
            query = query.filter(Budget.category_id == None)
        
        return query.first()
    
    def create(self, user_id: int, **kwargs) -> Budget:
        """Create a new budget"""
        budget = Budget(user_id=user_id, **kwargs)
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget
    
    def update(self, budget: Budget, **kwargs) -> Budget:
        """Update budget fields"""
        for key, value in kwargs.items():
            if value is not None and hasattr(budget, key):
                setattr(budget, key, value)
        
        self.db.commit()
        self.db.refresh(budget)
        return budget
    
    def delete(self, budget: Budget) -> None:
        """Delete a budget"""
        self.db.delete(budget)
        self.db.commit()

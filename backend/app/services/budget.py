"""
Budget service layer
"""
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.repositories.budget import BudgetRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.budget import BudgetCreate, BudgetStatus, BudgetUpdate, BudgetOverview


class BudgetService:
    """Service for budget operations and calculations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = BudgetRepository(db)
        self.transaction_repo = TransactionRepository(db)
    
    def get_budget(self, budget_id: int, user_id: int) -> Budget:
        """Get budget by ID"""
        budget = self.repo.get_by_id(budget_id, user_id)
        if not budget:
            raise ValueError("Budget not found")
        return budget
    
    def get_user_budgets(self, user_id: int) -> List[Budget]:
        """Get all budgets for a user"""
        return self.repo.get_all_for_user(user_id)
    
    def get_active_budgets(
        self, user_id: int, target_date: Optional[date] = None
    ) -> List[Budget]:
        """Get active budgets for a user"""
        return self.repo.get_active_budgets(user_id, target_date)
    
    def create_budget(self, user_id: int, budget_data: BudgetCreate) -> Budget:
        """Create a new budget"""
        # Check for overlapping budgets
        existing = self.repo.get_by_category(
            user_id,
            budget_data.category_id,
            budget_data.start_date,
            budget_data.end_date,
        )
        if existing:
            raise ValueError("A budget already exists for this category and period")
        
        return self.repo.create(
            user_id=user_id,
            category_id=budget_data.category_id,
            amount=budget_data.amount,
            period_type=budget_data.period_type,
            start_date=budget_data.start_date,
            end_date=budget_data.end_date,
        )
    
    def update_budget(self, budget_id: int, user_id: int, budget_data: BudgetUpdate) -> Budget:
        """Update a budget"""
        budget = self.get_budget(budget_id, user_id)
        update_data = budget_data.model_dump(exclude_unset=True)
        return self.repo.update(budget, **update_data)
    
    def delete_budget(self, budget_id: int, user_id: int) -> None:
        """Delete a budget"""
        budget = self.get_budget(budget_id, user_id)
        self.repo.delete(budget)
    
    def calculate_budget_status(self, budget: Budget, user_id: int) -> BudgetStatus:
        """Calculate budget status with spending information"""
        # Get total spending for the budget period
        spent = 0.0
        
        if budget.category_id:
            # Spending for specific category
            from app.schemas.transaction import TransactionFilter
            filters = TransactionFilter(
                category_id=budget.category_id,
                type="expense",
                start_date=budget.start_date,
                end_date=budget.end_date,
            )
            transactions = self.transaction_repo.get_all_for_user(
                user_id, filters, skip=0, limit=10000
            )
            spent = sum(t.amount for t in transactions)
        else:
            # Overall spending (all expenses)
            spent = self.transaction_repo.get_total_by_type(
                user_id, "expense", budget.start_date, budget.end_date
            )
        
        remaining = budget.amount - spent
        percentage_used = (spent / budget.amount * 100) if budget.amount > 0 else 0
        is_over_budget = spent > budget.amount
        
        return BudgetStatus(
            budget=budget,
            spent=spent,
            remaining=remaining,
            percentage_used=round(percentage_used, 2),
            is_over_budget=is_over_budget,
        )
    
    def get_budget_overview(
        self, user_id: int, target_date: Optional[date] = None
    ) -> BudgetOverview:
        """Get overall budget status for a user"""
        budgets = self.get_active_budgets(user_id, target_date)
        
        if not budgets:
            return BudgetOverview(
                total_budget=0.0,
                total_spent=0.0,
                total_remaining=0.0,
                percentage_used=0.0,
                category_budgets=[],
            )
        
        category_statuses = [
            self.calculate_budget_status(budget, user_id) for budget in budgets
        ]
        
        total_budget = sum(status.budget.amount for status in category_statuses)
        total_spent = sum(status.spent for status in category_statuses)
        total_remaining = total_budget - total_spent
        percentage_used = (
            (total_spent / total_budget * 100) if total_budget > 0 else 0
        )
        
        return BudgetOverview(
            total_budget=total_budget,
            total_spent=total_spent,
            total_remaining=total_remaining,
            percentage_used=round(percentage_used, 2),
            category_budgets=category_statuses,
        )

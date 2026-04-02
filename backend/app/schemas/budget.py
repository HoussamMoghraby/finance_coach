"""
Budget schemas for request/response validation
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    """Base budget schema"""
    category_id: Optional[int] = None  # NULL for overall budget
    amount: float = Field(..., gt=0)
    period_type: str = Field(default="monthly", description="monthly, yearly, or custom")
    start_date: date
    end_date: date


class BudgetCreate(BudgetBase):
    """Schema for creating a budget"""
    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget"""
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    period_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BudgetInDB(BudgetBase):
    """Budget schema as stored in database"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Budget(BudgetInDB):
    """Budget schema for API responses"""
    pass


class BudgetStatus(BaseModel):
    """Budget status with spending information"""
    budget: Budget
    spent: float
    remaining: float
    percentage_used: float
    is_over_budget: bool
    
    class Config:
        from_attributes = True


class BudgetOverview(BaseModel):
    """Overall budget overview for a period"""
    total_budget: float
    total_spent: float
    total_remaining: float
    percentage_used: float
    category_budgets: list[BudgetStatus]

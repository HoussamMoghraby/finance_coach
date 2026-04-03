"""
Recurring Transaction schemas for request/response validation
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class RecurringTransactionBase(BaseModel):
    """Base recurring transaction schema"""
    category_id: Optional[int] = None
    description: str
    expected_amount: float
    frequency: str = Field(..., description="daily, weekly, monthly, yearly")
    next_expected_date: date
    confidence_score: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    is_active: bool = True


class RecurringTransactionCreate(RecurringTransactionBase):
    """Schema for creating a recurring transaction"""
    pass


class RecurringTransactionUpdate(BaseModel):
    """Schema for updating a recurring transaction"""
    category_id: Optional[int] = None
    description: Optional[str] = None
    expected_amount: Optional[float] = None
    frequency: Optional[str] = None
    next_expected_date: Optional[date] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_active: Optional[bool] = None


class RecurringTransactionInDB(RecurringTransactionBase):
    """Recurring transaction schema as stored in database"""
    id: int
    user_id: int
    last_matched_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecurringTransaction(RecurringTransactionInDB):
    """Recurring transaction schema for API responses"""
    pass


class RecurringTransactionDetection(BaseModel):
    """Schema for detected recurring transaction pattern"""
    description: str

    category_id: Optional[int] = None
    expected_amount: float
    frequency: str
    transaction_count: int
    confidence_score: float
    sample_dates: list[date]

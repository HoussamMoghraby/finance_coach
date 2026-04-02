"""
Transaction schemas for request/response validation
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    """Base transaction schema"""
    account_id: int
    to_account_id: Optional[int] = None  # For internal transfers
    category_id: Optional[int] = None
    merchant_id: Optional[int] = None
    type: str = Field(..., description="Transaction type: income, expense, transfer")
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    description: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    transaction_date: date


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    pass


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    merchant_id: Optional[int] = None
    type: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    notes: Optional[str] = None
    transaction_date: Optional[date] = None


class TransactionInDB(TransactionBase):
    """Transaction schema as stored in database"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Transaction(TransactionInDB):
    """Transaction schema for API responses"""
    pass


class TransactionFilter(BaseModel):
    """Schema for filtering transactions"""
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    merchant_id: Optional[int] = None
    type: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

"""
Account schemas for request/response validation
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AccountBase(BaseModel):
    """Base account schema"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="Account type: bank, cash, credit_card, debit_card, savings")
    currency: str = Field(default="USD", max_length=3)
    opening_balance: float = Field(default=0.0)


class AccountCreate(AccountBase):
    """Schema for creating an account"""
    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=3)
    opening_balance: Optional[float] = None
    is_active: Optional[bool] = None


class AccountInDB(AccountBase):
    """Account schema as stored in database"""
    id: int
    user_id: int
    current_balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Account(AccountInDB):
    """Account schema for API responses"""
    pass

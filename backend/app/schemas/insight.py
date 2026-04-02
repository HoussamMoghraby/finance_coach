"""
Insight schemas
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class InsightBase(BaseModel):
    """Base insight schema"""
    type: str
    period_start: date
    period_end: date
    title: str
    summary: str


class InsightCreate(InsightBase):
    """Schema for creating an insight"""
    details_json: Optional[dict] = None


class InsightInDB(InsightBase):
    """Insight schema as stored in database"""
    id: int
    user_id: int
    details_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class Insight(InsightInDB):
    """Insight schema for API responses"""
    pass


class InsightGenerateRequest(BaseModel):
    """Request to generate an insight"""
    type: str  # daily, weekly, monthly
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ChatRequest(BaseModel):
    """AI chat request"""
    question: str


class ChatResponse(BaseModel):
    """AI chat response"""
    answer: str

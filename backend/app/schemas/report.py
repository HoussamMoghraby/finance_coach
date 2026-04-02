"""
Report schemas for analytics and dashboard data
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    """Spending breakdown by category"""
    category_id: Optional[int]
    category_name: str
    amount: float
    transaction_count: int
    percentage: float


class MerchantSummary(BaseModel):
    """Top merchant summary"""
    merchant_id: Optional[int]
    merchant_name: str
    amount: float
    transaction_count: int


class MonthlyTrend(BaseModel):
    """Monthly trend data point"""
    month: str  # YYYY-MM format
    income: float
    expenses: float
    net: float


class FinancialOverview(BaseModel):
    """Overall financial overview"""
    total_income: float
    total_expenses: float
    net_income: float
    total_accounts: int
    total_balance: float
    period_start: date
    period_end: date


class DashboardData(BaseModel):
    """Complete dashboard data"""
    overview: FinancialOverview
    category_breakdown: List[CategoryBreakdown]
    top_merchants: List[MerchantSummary]
    monthly_trends: List[MonthlyTrend]


class RecurringTransactionCandidate(BaseModel):
    """Recurring transaction detection candidate"""
    merchant_name: Optional[str]
    category_name: Optional[str]
    average_amount: float
    frequency_days: int
    occurrences: int
    last_date: date
    next_expected_date: date
    confidence_score: float

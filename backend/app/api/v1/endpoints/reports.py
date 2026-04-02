"""
Report endpoints for analytics and dashboards
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import (
    CategoryBreakdown,
    DashboardData,
    FinancialOverview,
    MerchantSummary,
    MonthlyTrend,
    RecurringTransactionCandidate,
)
from app.services.report import ReportService


router = APIRouter()


@router.get("/overview", response_model=FinancialOverview)
async def get_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get financial overview for a period"""
    service = ReportService(db)
    return service.get_financial_overview(current_user.id, start_date, end_date)


@router.get("/category-breakdown", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    transaction_type: str = Query("expense", regex="^(income|expense)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get spending/income breakdown by category"""
    service = ReportService(db)
    return service.get_category_breakdown(
        current_user.id, transaction_type, start_date, end_date
    )


@router.get("/top-merchants", response_model=List[MerchantSummary])
async def get_top_merchants(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top merchants by spending"""
    service = ReportService(db)
    return service.get_top_merchants(current_user.id, limit, start_date, end_date)


@router.get("/monthly-trend", response_model=List[MonthlyTrend])
async def get_monthly_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get monthly income/expense trends"""
    service = ReportService(db)
    return service.get_monthly_trends(current_user.id, months)


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete dashboard data"""
    service = ReportService(db)
    return service.get_dashboard_data(current_user.id, start_date, end_date)


@router.get("/recurring", response_model=List[RecurringTransactionCandidate])
async def detect_recurring(
    min_occurrences: int = Query(3, ge=2, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detect potential recurring transactions"""
    service = ReportService(db)
    return service.detect_recurring_transactions(current_user.id, min_occurrences)

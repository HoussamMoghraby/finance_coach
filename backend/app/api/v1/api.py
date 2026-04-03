"""
API v1 router
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    accounts,
    categories,
    transactions,
    budgets,
    reports,
    insights,
    recurring_transactions,
    notifications,
)


api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(
    recurring_transactions.router, prefix="/recurring-transactions", tags=["recurring-transactions"]
)
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

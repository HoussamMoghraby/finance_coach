"""
Recurring Transaction endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.recurring_transaction import (
    RecurringTransaction,
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionDetection,
)
from app.services.recurring_transaction import RecurringTransactionService


router = APIRouter()


@router.get("", response_model=List[RecurringTransaction])
async def get_recurring_transactions(
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all recurring transactions for current user"""
    service = RecurringTransactionService(db)
    return service.get_all_recurring(current_user.id, active_only)


@router.get("/upcoming", response_model=List[RecurringTransaction])
async def get_upcoming_recurring(
    days_ahead: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get upcoming recurring transactions"""
    service = RecurringTransactionService(db)
    return service.get_upcoming_recurring(current_user.id, days_ahead)


@router.post("/detect", response_model=List[RecurringTransactionDetection])
async def detect_recurring_patterns(
    min_occurrences: int = Query(3, ge=2, le=10),
    lookback_days: int = Query(180, ge=30, le=730),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Detect recurring transaction patterns from historical data
    
    - **min_occurrences**: Minimum number of transactions to consider a pattern (default: 3)
    - **lookback_days**: How many days back to analyze (default: 180)
    """
    service = RecurringTransactionService(db)
    return service.detect_recurring_patterns(
        current_user.id, min_occurrences, lookback_days
    )


@router.get("/{recurring_id}", response_model=RecurringTransaction)
async def get_recurring_transaction(
    recurring_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific recurring transaction"""
    service = RecurringTransactionService(db)
    try:
        return service.get_recurring(recurring_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=RecurringTransaction, status_code=status.HTTP_201_CREATED)
async def create_recurring_transaction(
    recurring_data: RecurringTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new recurring transaction"""
    service = RecurringTransactionService(db)
    return service.create_recurring(current_user.id, recurring_data)


@router.put("/{recurring_id}", response_model=RecurringTransaction)
async def update_recurring_transaction(
    recurring_id: int,
    recurring_data: RecurringTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a recurring transaction"""
    service = RecurringTransactionService(db)
    try:
        return service.update_recurring(recurring_id, current_user.id, recurring_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_transaction(
    recurring_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a recurring transaction"""
    service = RecurringTransactionService(db)
    try:
        service.delete_recurring(recurring_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

"""
Budget endpoints
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.budget import Budget, BudgetCreate, BudgetOverview, BudgetStatus, BudgetUpdate
from app.services.budget import BudgetService


router = APIRouter()


@router.get("", response_model=List[Budget])
async def get_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all budgets for current user"""
    service = BudgetService(db)
    return service.get_user_budgets(current_user.id)


@router.get("/status", response_model=BudgetOverview)
async def get_budget_status(
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get budget overview with spending status"""
    service = BudgetService(db)
    return service.get_budget_overview(current_user.id, target_date)


@router.get("/{budget_id}", response_model=Budget)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific budget"""
    service = BudgetService(db)
    try:
        return service.get_budget(budget_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{budget_id}/status", response_model=BudgetStatus)
async def get_single_budget_status(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get status for a specific budget"""
    service = BudgetService(db)
    try:
        budget = service.get_budget(budget_id, current_user.id)
        return service.calculate_budget_status(budget, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=Budget, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new budget"""
    service = BudgetService(db)
    try:
        return service.create_budget(current_user.id, budget_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a budget"""
    service = BudgetService(db)
    try:
        return service.update_budget(budget_id, current_user.id, budget_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a budget"""
    service = BudgetService(db)
    try:
        service.delete_budget(budget_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

"""
Transaction endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.transaction import Transaction, TransactionCreate, TransactionFilter, TransactionUpdate
from app.services.transaction import TransactionService


router = APIRouter()


@router.get("", response_model=List[Transaction])
async def get_transactions(
    account_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    merchant_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all transactions for current user with optional filters"""
    filters = TransactionFilter(
        account_id=account_id,
        category_id=category_id,
        merchant_id=merchant_id,
        type=type,
    )
    service = TransactionService(db)
    return service.get_user_transactions(current_user.id, filters, skip, limit)


@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific transaction"""
    service = TransactionService(db)
    try:
        return service.get_transaction(transaction_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new transaction"""
    service = TransactionService(db)
    try:
        return service.create_transaction(current_user.id, transaction_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a transaction"""
    service = TransactionService(db)
    try:
        return service.update_transaction(transaction_id, current_user.id, transaction_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a transaction"""
    service = TransactionService(db)
    try:
        service.delete_transaction(transaction_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

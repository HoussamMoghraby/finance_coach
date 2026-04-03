"""
Transaction repository for database operations
"""
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionFilter


class TransactionRepository:
    """Repository for transaction data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, transaction_id: int, user_id: int) -> Optional[Transaction]:
        """Get transaction by ID for specific user"""
        return (
            self.db.query(Transaction)
            .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
            .first()
        )
    
    def get_all_for_user(
        self,
        user_id: int,
        filters: Optional[TransactionFilter] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """Get all transactions for a user with optional filters"""
        query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
        
        if filters:
            if filters.account_id:
                query = query.filter(Transaction.account_id == filters.account_id)
            if filters.category_id:
                query = query.filter(Transaction.category_id == filters.category_id)
            if filters.type:
                query = query.filter(Transaction.type == filters.type)
            if filters.min_amount is not None:
                query = query.filter(Transaction.amount >= filters.min_amount)
            if filters.max_amount is not None:
                query = query.filter(Transaction.amount <= filters.max_amount)
            if filters.start_date:
                query = query.filter(Transaction.transaction_date >= filters.start_date)
            if filters.end_date:
                query = query.filter(Transaction.transaction_date <= filters.end_date)
        
        return (
            query.order_by(Transaction.transaction_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create(self, user_id: int, **kwargs) -> Transaction:
        """Create a new transaction"""
        transaction = Transaction(user_id=user_id, **kwargs)
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def update(self, transaction: Transaction, **kwargs) -> Transaction:
        """Update transaction fields"""
        for key, value in kwargs.items():
            if value is not None and hasattr(transaction, key):
                setattr(transaction, key, value)
        
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def delete(self, transaction: Transaction) -> None:
        """Delete a transaction"""
        self.db.delete(transaction)
        self.db.commit()
    
    def get_total_by_type(
        self,
        user_id: int,
        transaction_type: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> float:
        """Get total amount for a transaction type in a date range"""
        from sqlalchemy import func
        
        query = self.db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == transaction_type,
        )
        
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        
        result = query.scalar()
        return result if result is not None else 0.0

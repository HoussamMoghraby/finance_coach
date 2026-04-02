"""
Transaction service layer
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.account import AccountRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionFilter, TransactionUpdate


class TransactionService:
    """Service for transaction operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = TransactionRepository(db)
        self.account_repo = AccountRepository(db)
    
    def get_transaction(self, transaction_id: int, user_id: int) -> Transaction:
        """Get transaction by ID"""
        transaction = self.repo.get_by_id(transaction_id, user_id)
        if not transaction:
            raise ValueError("Transaction not found")
        return transaction
    
    def get_user_transactions(
        self,
        user_id: int,
        filters: Optional[TransactionFilter] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        """Get all transactions for a user with optional filters"""
        return self.repo.get_all_for_user(user_id, filters, skip, limit)
    
    def create_transaction(self, user_id: int, transaction_data: TransactionCreate) -> Transaction:
        """Create a new transaction and update account balance"""
        # Verify account belongs to user
        account = self.account_repo.get_by_id(transaction_data.account_id, user_id)
        if not account:
            raise ValueError("Account not found")
        
        # Create transaction
        transaction = self.repo.create(
            user_id=user_id,
            account_id=transaction_data.account_id,
            category_id=transaction_data.category_id,
            merchant_id=transaction_data.merchant_id,
            type=transaction_data.type,
            amount=transaction_data.amount,
            currency=transaction_data.currency,
            description=transaction_data.description,
            notes=transaction_data.notes,
            transaction_date=transaction_data.transaction_date,
        )
        
        # Update account balance
        is_income = transaction_data.type == "income"
        self.account_repo.update_balance(account, transaction_data.amount, is_income)
        
        return transaction
    
    def update_transaction(
        self, transaction_id: int, user_id: int, transaction_data: TransactionUpdate
    ) -> Transaction:
        """Update a transaction and adjust account balance if amount changed"""
        transaction = self.get_transaction(transaction_id, user_id)
        old_amount = transaction.amount
        old_type = transaction.type
        old_account_id = transaction.account_id
        
        update_data = transaction_data.model_dump(exclude_unset=True)
        
        # If account changed, verify new account belongs to user
        if "account_id" in update_data and update_data["account_id"] != old_account_id:
            new_account = self.account_repo.get_by_id(update_data["account_id"], user_id)
            if not new_account:
                raise ValueError("New account not found")
        
        # Update transaction
        updated_transaction = self.repo.update(transaction, **update_data)
        
        # Adjust account balances if amount or type changed
        if "amount" in update_data or "type" in update_data or "account_id" in update_data:
            # Reverse old transaction effect
            old_account = self.account_repo.get_by_id(old_account_id, user_id)
            is_old_income = old_type == "income"
            self.account_repo.update_balance(old_account, old_amount, not is_old_income)
            
            # Apply new transaction effect
            new_account_id = updated_transaction.account_id
            new_account = self.account_repo.get_by_id(new_account_id, user_id)
            is_new_income = updated_transaction.type == "income"
            self.account_repo.update_balance(
                new_account, updated_transaction.amount, is_new_income
            )
        
        return updated_transaction
    
    def delete_transaction(self, transaction_id: int, user_id: int) -> None:
        """Delete a transaction and adjust account balance"""
        transaction = self.get_transaction(transaction_id, user_id)
        
        # Reverse transaction effect on account balance
        account = self.account_repo.get_by_id(transaction.account_id, user_id)
        is_income = transaction.type == "income"
        self.account_repo.update_balance(account, transaction.amount, not is_income)
        
        # Delete transaction
        self.repo.delete(transaction)

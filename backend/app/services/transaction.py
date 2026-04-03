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
        
        # For internal transfers, verify target account
        if transaction_data.type == "transfer" and transaction_data.to_account_id:
            to_account = self.account_repo.get_by_id(transaction_data.to_account_id, user_id)
            if not to_account:
                raise ValueError("Target account not found")
            if transaction_data.to_account_id == transaction_data.account_id:
                raise ValueError("Source and target accounts cannot be the same")
        
        # Create transaction
        transaction = self.repo.create(
            user_id=user_id,
            account_id=transaction_data.account_id,
            to_account_id=transaction_data.to_account_id,
            category_id=transaction_data.category_id,
            type=transaction_data.type,
            amount=transaction_data.amount,
            currency=transaction_data.currency,
            description=transaction_data.description,
            notes=transaction_data.notes,
            transaction_date=transaction_data.transaction_date,
        )
        
        # Update account balances based on transaction type
        if transaction_data.type == "transfer" and transaction_data.to_account_id:
            # Internal transfer: deduct from source, add to target
            self.account_repo.update_balance(account, transaction_data.amount, False)  # Deduct from source
            to_account = self.account_repo.get_by_id(transaction_data.to_account_id, user_id)
            self.account_repo.update_balance(to_account, transaction_data.amount, True)  # Add to target
        elif transaction_data.type == "income":
            # Income: add to account
            self.account_repo.update_balance(account, transaction_data.amount, True)
        elif transaction_data.type == "expense":
            # Expense: deduct from account
            self.account_repo.update_balance(account, transaction_data.amount, False)
            
            # Check budget thresholds after expense
            if transaction_data.category_id:
                self._check_budget_thresholds(user_id, transaction_data.category_id)
            
            # Check for unusual spending
            if transaction_data.category_id:
                self._check_unusual_spending(user_id, transaction)
        
        return transaction
    
    def update_transaction(
        self, transaction_id: int, user_id: int, transaction_data: TransactionUpdate
    ) -> Transaction:
        """Update a transaction and adjust account balance if amount changed"""
        transaction = self.get_transaction(transaction_id, user_id)
        old_amount = transaction.amount
        old_type = transaction.type
        old_account_id = transaction.account_id
        old_to_account_id = transaction.to_account_id
        
        update_data = transaction_data.model_dump(exclude_unset=True)
        
        # Verify new accounts belong to user if changed
        if "account_id" in update_data and update_data["account_id"] != old_account_id:
            new_account = self.account_repo.get_by_id(update_data["account_id"], user_id)
            if not new_account:
                raise ValueError("New account not found")
        
        if "to_account_id" in update_data and update_data["to_account_id"]:
            to_account = self.account_repo.get_by_id(update_data["to_account_id"], user_id)
            if not to_account:
                raise ValueError("Target account not found")
        
        # Reverse old transaction effect on account balances
        if old_type == "transfer" and old_to_account_id:
            # Was an internal transfer - reverse both sides
            old_account = self.account_repo.get_by_id(old_account_id, user_id)
            old_to_account = self.account_repo.get_by_id(old_to_account_id, user_id)
            self.account_repo.update_balance(old_account, old_amount, True)  # Add back to source
            self.account_repo.update_balance(old_to_account, old_amount, False)  # Deduct from target
        elif old_type == "income":
            # Was income - reverse by deducting
            old_account = self.account_repo.get_by_id(old_account_id, user_id)
            self.account_repo.update_balance(old_account, old_amount, False)
        elif old_type == "expense":
            # Was expense - reverse by adding
            old_account = self.account_repo.get_by_id(old_account_id, user_id)
            self.account_repo.update_balance(old_account, old_amount, True)
        
        # Update transaction
        updated_transaction = self.repo.update(transaction, **update_data)
        
        # Apply new transaction effect on account balances
        new_type = updated_transaction.type
        new_amount = updated_transaction.amount
        new_account_id = updated_transaction.account_id
        new_to_account_id = updated_transaction.to_account_id
        
        if new_type == "transfer" and new_to_account_id:
            # Internal transfer - deduct from source, add to target
            new_account = self.account_repo.get_by_id(new_account_id, user_id)
            new_to_account = self.account_repo.get_by_id(new_to_account_id, user_id)
            self.account_repo.update_balance(new_account, new_amount, False)
            self.account_repo.update_balance(new_to_account, new_amount, True)
        elif new_type == "income":
            # Income - add to account
            new_account = self.account_repo.get_by_id(new_account_id, user_id)
            self.account_repo.update_balance(new_account, new_amount, True)
        elif new_type == "expense":
            # Expense - deduct from account
            new_account = self.account_repo.get_by_id(new_account_id, user_id)
            self.account_repo.update_balance(new_account, new_amount, False)
        
        return updated_transaction
    
    def delete_transaction(self, transaction_id: int, user_id: int) -> None:
        """Delete a transaction and adjust account balance"""
        transaction = self.get_transaction(transaction_id, user_id)
        
        # Reverse transaction effect on account balance
        if transaction.type == "transfer" and transaction.to_account_id:
            # Internal transfer - reverse both sides
            account = self.account_repo.get_by_id(transaction.account_id, user_id)
            to_account = self.account_repo.get_by_id(transaction.to_account_id, user_id)
            self.account_repo.update_balance(account, transaction.amount, True)  # Add back to source
            self.account_repo.update_balance(to_account, transaction.amount, False)  # Deduct from target
        elif transaction.type == "income":
            # Reverse income by deducting
            account = self.account_repo.get_by_id(transaction.account_id, user_id)
            self.account_repo.update_balance(account, transaction.amount, False)
        elif transaction.type == "expense":
            # Reverse expense by adding
            account = self.account_repo.get_by_id(transaction.account_id, user_id)
            self.account_repo.update_balance(account, transaction.amount, True)
        
        # Delete transaction
        self.repo.delete(transaction)
    
    def _check_budget_thresholds(self, user_id: int, category_id: int) -> None:
        """Check budget thresholds and create notifications if needed"""
        try:
            from app.services.budget import BudgetService
            budget_service = BudgetService(self.db)
            budget_service.check_and_notify_budget_thresholds(user_id, category_id)
        except Exception:
            # Don't fail transaction creation if notification fails
            pass
    
    def _check_unusual_spending(self, user_id: int, transaction: Transaction) -> None:
        """Check for unusual spending and create notification if detected"""
        try:
            from app.services.notification import NotificationService
            from datetime import timedelta
            
            # Get average spending for this category in the last 90 days
            filters = TransactionFilter(
                category_id=transaction.category_id,
                type="expense",
                start_date=transaction.transaction_date - timedelta(days=90),
                end_date=transaction.transaction_date,
            )
            recent_transactions = self.repo.get_all_for_user(user_id, filters, skip=0, limit=1000)
            
            # Need at least 5 transactions to establish a pattern
            if len(recent_transactions) < 5:
                return
            
            # Calculate average amount
            total = sum(t.amount for t in recent_transactions if t.id != transaction.id)
            count = len([t for t in recent_transactions if t.id != transaction.id])
            
            if count == 0:
                return
                
            average = total / count
            
            # If current transaction is more than 2x the average, it's unusual
            if transaction.amount > average * 2:
                notification_service = NotificationService(self.db)
                
                # Get category name
                category_name = "Uncategorized"
                if transaction.category_id:
                    from app.repositories.category import CategoryRepository
                    category_repo = CategoryRepository(self.db)
                    category = category_repo.get_by_id(transaction.category_id, user_id)
                    if category:
                        category_name = category.name
                
                notification_service.create_unusual_spending_notification(
                    user_id=user_id,
                    category=category_name,
                    amount=transaction.amount,
                    average=average,
                )
        except Exception:
            # Don't fail transaction creation if notification fails
            pass

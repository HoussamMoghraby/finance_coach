"""
Account service layer
"""
from typing import List
from sqlalchemy.orm import Session

from app.models.account import Account
from app.repositories.account import AccountRepository
from app.schemas.account import AccountCreate, AccountUpdate


class AccountService:
    """Service for account operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = AccountRepository(db)
    
    def get_account(self, account_id: int, user_id: int) -> Account:
        """Get account by ID"""
        account = self.repo.get_by_id(account_id, user_id)
        if not account:
            raise ValueError("Account not found")
        return account
    
    def get_user_accounts(self, user_id: int, include_inactive: bool = False) -> List[Account]:
        """Get all accounts for a user"""
        return self.repo.get_all_for_user(user_id, include_inactive)
    
    def create_account(self, user_id: int, account_data: AccountCreate) -> Account:
        """Create a new account"""
        return self.repo.create(
            user_id=user_id,
            name=account_data.name,
            type=account_data.type,
            currency=account_data.currency,
            opening_balance=account_data.opening_balance,
        )
    
    def update_account(self, account_id: int, user_id: int, account_data: AccountUpdate) -> Account:
        """Update an account"""
        account = self.get_account(account_id, user_id)
        
        update_data = account_data.model_dump(exclude_unset=True)
        return self.repo.update(account, **update_data)
    
    def delete_account(self, account_id: int, user_id: int) -> None:
        """Delete an account"""
        account = self.get_account(account_id, user_id)
        self.repo.delete(account)

"""
Account repository for database operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.account import Account


class AccountRepository:
    """Repository for account data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, account_id: int, user_id: int) -> Optional[Account]:
        """Get account by ID for specific user"""
        return (
            self.db.query(Account)
            .filter(Account.id == account_id, Account.user_id == user_id)
            .first()
        )
    
    def get_all_for_user(self, user_id: int, include_inactive: bool = False) -> List[Account]:
        """Get all accounts for a user"""
        query = self.db.query(Account).filter(Account.user_id == user_id)
        if not include_inactive:
            query = query.filter(Account.is_active == True)
        return query.all()
    
    def create(self, user_id: int, **kwargs) -> Account:
        """Create a new account"""
        account = Account(
            user_id=user_id,
            current_balance=kwargs.get("opening_balance", 0.0),
            **kwargs
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def update(self, account: Account, **kwargs) -> Account:
        """Update account fields"""
        for key, value in kwargs.items():
            if value is not None and hasattr(account, key):
                setattr(account, key, value)
        
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def update_balance(self, account: Account, amount: float, is_income: bool = True) -> Account:
        """Update account balance"""
        if is_income:
            account.current_balance += amount
        else:
            account.current_balance -= amount
        
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def delete(self, account: Account) -> None:
        """Delete an account"""
        self.db.delete(account)
        self.db.commit()

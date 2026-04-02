"""
User repository for database operations
"""
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import get_password_hash


class UserRepository:
    """Repository for user data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def create(self, email: str, password: str) -> User:
        """Create a new user"""
        hashed_password = get_password_hash(password)
        db_user = User(
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=False,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def update(self, user: User, **kwargs) -> User:
        """Update user fields"""
        for key, value in kwargs.items():
            if value is not None:
                if key == "password":
                    setattr(user, "hashed_password", get_password_hash(value))
                else:
                    setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete(self, user: User) -> None:
        """Delete a user"""
        self.db.delete(user)
        self.db.commit()

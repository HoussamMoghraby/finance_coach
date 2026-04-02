"""
Authentication service layer
"""
from typing import Optional
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user by email and password
        Returns user if credentials are valid, None otherwise
        """
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    
    def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user
        Raises ValueError if email already exists
        """
        existing_user = self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise ValueError("Email already registered")
        
        return self.user_repo.create(
            email=user_data.email,
            password=user_data.password,
        )
    
    def create_user_token(self, user: User) -> str:
        """Create access token for user"""
        return create_access_token(data={"sub": str(user.id)})

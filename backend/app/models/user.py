"""
User model
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """User model for authentication and user management"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (will be added as we build other models)
    # accounts = relationship("Account", back_populates="user")
    # transactions = relationship("Transaction", back_populates="user")
    # budgets = relationship("Budget", back_populates="user")
    # insights = relationship("Insight", back_populates="user")
    # notifications = relationship("Notification", back_populates="user")

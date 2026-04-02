"""
Merchant model for tracking transaction sources
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Merchant(Base):
    """Merchant model for tracking where transactions occur"""
    
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # NULL for system merchants
    name = Column(String, nullable=False)
    normalized_name = Column(String, nullable=False, index=True)  # Lowercase, no special chars
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="merchants")
    transactions = relationship("Transaction", back_populates="merchant")

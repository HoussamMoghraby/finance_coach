"""
Transaction model for tracking financial transactions
"""
from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Transaction(Base):
    """Transaction model for income and expenses"""
    
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True, index=True)  # For internal transfers
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True, index=True)
    type = Column(String, nullable=False, index=True)  # income, expense, transfer
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    description = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    transaction_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="transactions")
    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    to_account = relationship("Account", foreign_keys=[to_account_id], back_populates="incoming_transfers")
    category = relationship("Category", back_populates="transactions")
    merchant = relationship("Merchant", back_populates="transactions")

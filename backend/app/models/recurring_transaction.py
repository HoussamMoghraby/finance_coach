"""
Recurring Transaction model for tracking recurring payments and income
"""
from datetime import date, datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class RecurringTransaction(Base):
    """Recurring Transaction model for subscriptions, bills, salary, etc."""
    
    __tablename__ = "recurring_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    description = Column(String, nullable=False)
    expected_amount = Column(Float, nullable=False)
    frequency = Column(String, nullable=False)  # daily, weekly, monthly, yearly
    next_expected_date = Column(Date, nullable=False, index=True)
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    is_active = Column(Boolean, default=True)
    last_matched_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="recurring_transactions")
    merchant = relationship("Merchant", backref="recurring_transactions")
    category = relationship("Category", backref="recurring_transactions")

"""
Insight model for storing AI-generated insights
"""
from datetime import date, datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class Insight(Base):
    """Insight model for AI-generated financial insights"""
    
    __tablename__ = "insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # daily, weekly, monthly, custom
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    details_json = Column(JSON, nullable=True)  # Additional structured data
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="insights")


class AIInteraction(Base):
    """Track AI interactions for monitoring and debugging"""
    
    __tablename__ = "ai_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_type = Column(String, nullable=False)  # summary, chat, categorize, etc.
    prompt_template_name = Column(String, nullable=True)
    model_name = Column(String, nullable=False)
    input_summary = Column(Text, nullable=True)  # Brief summary of input
    output_text = Column(Text, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="ai_interactions")

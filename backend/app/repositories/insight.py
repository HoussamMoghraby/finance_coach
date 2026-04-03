"""
Insight repository for database operations
"""
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.models.insight import Insight


class InsightRepository:
    """Repository for insight database operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Insight
    
    def create(
        self,
        user_id: int,
        type: str,
        period_start: date,
        period_end: date,
        title: str,
        summary: str,
        details_json: Optional[dict] = None,
    ) -> Insight:
        """Create a new insight"""
        insight = Insight(
            user_id=user_id,
            type=type,
            period_start=period_start,
            period_end=period_end,
            title=title,
            summary=summary,
            details_json=details_json,
        )
        self.db.add(insight)
        self.db.commit()
        self.db.refresh(insight)
        return insight
    
    def get_by_id(self, insight_id: int, user_id: int) -> Optional[Insight]:
        """Get insight by ID for a specific user"""
        return (
            self.db.query(Insight)
            .filter(Insight.id == insight_id, Insight.user_id == user_id)
            .first()
        )
    
    def get_by_user(
        self,
        user_id: int,
        type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Insight]:
        """Get insights for a user, optionally filtered by type"""
        query = self.db.query(Insight).filter(Insight.user_id == user_id)
        
        if type:
            query = query.filter(Insight.type == type)
        
        return (
            query.order_by(Insight.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def get_latest_by_type(
        self,
        user_id: int,
        type: str,
    ) -> Optional[Insight]:
        """Get the most recent insight of a specific type for a user"""
        return (
            self.db.query(Insight)
            .filter(Insight.user_id == user_id, Insight.type == type)
            .order_by(Insight.created_at.desc())
            .first()
        )
    
    def delete(self, insight_id: int, user_id: int) -> bool:
        """Delete an insight"""
        insight = self.get_by_id(insight_id, user_id)
        if insight:
            self.db.delete(insight)
            self.db.commit()
            return True
        return False

"""
Category repository for database operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryRepository:
    """Repository for category data access"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, category_id: int, user_id: Optional[int] = None) -> Optional[Category]:
        """Get category by ID"""
        query = self.db.query(Category).filter(Category.id == category_id)
        if user_id is not None:
            # Allow access to system categories (user_id is None) or user's own categories
            query = query.filter((Category.user_id == user_id) | (Category.user_id == None))
        return query.first()
    
    def get_all_for_user(self, user_id: int, include_inactive: bool = False) -> List[Category]:
        """Get all categories accessible to a user (system + user's own)"""
        query = self.db.query(Category).filter(
            (Category.user_id == user_id) | (Category.user_id == None)
        )
        if not include_inactive:
            query = query.filter(Category.is_active == True)
        return query.order_by(Category.type, Category.name).all()
    
    def get_system_categories(self) -> List[Category]:
        """Get all system categories"""
        return self.db.query(Category).filter(Category.is_system == True).all()
    
    def create(self, user_id: Optional[int], name: str, type: str, **kwargs) -> Category:
        """Create a new category"""
        category = Category(
            user_id=user_id,
            name=name,
            type=type,
            is_system=user_id is None,
            **kwargs
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def create_system_category(self, name: str, type: str, **kwargs) -> Category:
        """Create a system category"""
        return self.create(user_id=None, name=name, type=type, **kwargs)
    
    def update(self, category: Category, **kwargs) -> Category:
        """Update category fields"""
        for key, value in kwargs.items():
            if value is not None and hasattr(category, key):
                setattr(category, key, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete(self, category: Category) -> None:
        """Delete a category"""
        self.db.delete(category)
        self.db.commit()

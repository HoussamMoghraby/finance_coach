"""
Category service layer
"""
from typing import List
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    """Service for category operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)
    
    def get_category(self, category_id: int, user_id: int) -> Category:
        """Get category by ID"""
        category = self.repo.get_by_id(category_id, user_id)
        if not category:
            raise ValueError("Category not found")
        return category
    
    def get_user_categories(self, user_id: int, include_inactive: bool = False) -> List[Category]:
        """Get all categories accessible to a user"""
        return self.repo.get_all_for_user(user_id, include_inactive)
    
    def create_category(self, user_id: int, category_data: CategoryCreate) -> Category:
        """Create a new user category"""
        return self.repo.create(
            user_id=user_id,
            name=category_data.name,
            type=category_data.type,
            parent_id=category_data.parent_id,
        )
    
    def update_category(
        self, category_id: int, user_id: int, category_data: CategoryUpdate
    ) -> Category:
        """Update a category"""
        category = self.get_category(category_id, user_id)
        
        # Only allow updating user's own categories, not system categories
        if category.is_system:
            raise ValueError("Cannot update system categories")
        
        if category.user_id != user_id:
            raise ValueError("Cannot update another user's category")
        
        update_data = category_data.model_dump(exclude_unset=True)
        return self.repo.update(category, **update_data)
    
    def delete_category(self, category_id: int, user_id: int) -> None:
        """Delete a category"""
        category = self.get_category(category_id, user_id)
        
        if category.is_system:
            raise ValueError("Cannot delete system categories")
        
        if category.user_id != user_id:
            raise ValueError("Cannot delete another user's category")
        
        self.repo.delete(category)

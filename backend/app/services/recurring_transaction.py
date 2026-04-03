"""
Recurring Transaction service layer
"""
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from collections import defaultdict

from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.repositories.recurring_transaction import RecurringTransactionRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionDetection,
)


class RecurringTransactionService:
    """Service for recurring transaction operations and detection"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = RecurringTransactionRepository(db)
        self.transaction_repo = TransactionRepository(db)
    
    def get_recurring(self, recurring_id: int, user_id: int) -> RecurringTransaction:
        """Get recurring transaction by ID"""
        recurring = self.repo.get_by_id(recurring_id, user_id)
        if not recurring:
            raise ValueError("Recurring transaction not found")
        return recurring
    
    def get_all_recurring(
        self, user_id: int, active_only: bool = False
    ) -> List[RecurringTransaction]:
        """Get all recurring transactions for a user"""
        return self.repo.get_all_for_user(user_id, active_only)
    
    def get_upcoming_recurring(
        self, user_id: int, days_ahead: int = 30
    ) -> List[RecurringTransaction]:
        """Get upcoming recurring transactions"""
        target_date = date.today() + timedelta(days=days_ahead)
        return self.repo.get_upcoming(user_id, target_date, active_only=True)
    
    def create_recurring(
        self, user_id: int, recurring_data: RecurringTransactionCreate
    ) -> RecurringTransaction:
        """Create a new recurring transaction"""
        return self.repo.create(
            user_id=user_id,
            category_id=recurring_data.category_id,
            description=recurring_data.description,
            expected_amount=recurring_data.expected_amount,
            frequency=recurring_data.frequency,
            next_expected_date=recurring_data.next_expected_date,
            confidence_score=recurring_data.confidence_score,
            is_active=recurring_data.is_active,
        )
    
    def update_recurring(
        self, recurring_id: int, user_id: int, recurring_data: RecurringTransactionUpdate
    ) -> RecurringTransaction:
        """Update a recurring transaction"""
        recurring = self.get_recurring(recurring_id, user_id)
        update_data = recurring_data.model_dump(exclude_unset=True)
        return self.repo.update(recurring, **update_data)
    
    def delete_recurring(self, recurring_id: int, user_id: int) -> None:
        """Delete a recurring transaction"""
        recurring = self.get_recurring(recurring_id, user_id)
        self.repo.delete(recurring)
    
    def detect_recurring_patterns(
        self, user_id: int, min_occurrences: int = 3, lookback_days: int = 180
    ) -> List[RecurringTransactionDetection]:
        """
        Detect recurring transaction patterns from historical transactions
        
        This algorithm:
        1. Groups transactions by description/merchant
        2. Analyzes date patterns to detect frequency
        3. Calculates confidence score based on consistency
        """
        # Get all transactions for the user in lookback period
        start_date = date.today() - timedelta(days=lookback_days)
        
        from app.schemas.transaction import TransactionFilter
        filters = TransactionFilter(start_date=start_date)
        transactions = self.transaction_repo.get_all_for_user(
            user_id, filters, skip=0, limit=10000
        )
        
        # Group by description (normalized)
        grouped = defaultdict(list)
        for txn in transactions:
            key = self._normalize_description(txn.description)
            grouped[key].append(txn)
        
        detections = []
        
        for description, txns in grouped.items():
            if len(txns) < min_occurrences:
                continue
            
            # Sort by date
            txns.sort(key=lambda t: t.transaction_date)
            
            # Calculate intervals between transactions
            intervals = []
            for i in range(1, len(txns)):
                delta = (txns[i].transaction_date - txns[i-1].transaction_date).days
                intervals.append(delta)
            
            if not intervals:
                continue
            
            # Detect frequency pattern
            frequency, confidence = self._detect_frequency(intervals)
            
            if confidence < 0.5:  # Skip low confidence patterns
                continue
            
            # Calculate expected amount (median of recent transactions)
            amounts = [t.amount for t in txns]
            expected_amount = sorted(amounts)[len(amounts) // 2]
            
            # Calculate next expected date
            last_date = txns[-1].transaction_date
            next_date = self._calculate_next_date(last_date, frequency)
            
            detection = RecurringTransactionDetection(
                description=description,
                category_id=txns[0].category_id,
                expected_amount=expected_amount,
                frequency=frequency,
                transaction_count=len(txns),
                confidence_score=round(confidence, 2),
                sample_dates=[t.transaction_date for t in txns[-5:]],  # Last 5 dates
            )
            
            detections.append(detection)
        
        # Sort by confidence score
        detections.sort(key=lambda d: d.confidence_score, reverse=True)
        
        return detections
    
    def _normalize_description(self, description: str) -> str:
        """Normalize transaction description for grouping"""
        # Remove common variations like dates, transaction IDs
        normalized = description.lower().strip()
        # Remove trailing numbers that might be transaction IDs
        import re
        normalized = re.sub(r'\s+#?\d+$', '', normalized)
        normalized = re.sub(r'\s+\d{1,2}/\d{1,2}(/\d{2,4})?', '', normalized)
        return normalized
    
    def _detect_frequency(self, intervals: List[int]) -> tuple[str, float]:
        """
        Detect frequency pattern from intervals
        Returns (frequency, confidence_score)
        """
        if not intervals:
            return "monthly", 0.0
        
        avg_interval = sum(intervals) / len(intervals)
        std_dev = (sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)) ** 0.5
        
        # Calculate consistency (lower std dev = higher consistency)
        consistency = max(0, 1 - (std_dev / avg_interval)) if avg_interval > 0 else 0
        
        # Determine frequency based on average interval
        if 0 <= avg_interval <= 2:
            frequency = "daily"
            # Daily should be very consistent
            confidence = consistency if consistency > 0.8 else 0
        elif 5 <= avg_interval <= 9:
            frequency = "weekly"
            confidence = consistency if consistency > 0.7 else 0
        elif 25 <= avg_interval <= 35:
            frequency = "monthly"
            confidence = consistency
        elif 85 <= avg_interval <= 95:
            frequency = "quarterly"
            confidence = consistency if consistency > 0.6 else 0
        elif 350 <= avg_interval <= 380:
            frequency = "yearly"
            confidence = consistency if consistency > 0.5 else 0
        else:
            # Custom/irregular pattern
            frequency = "monthly"  # Default to monthly
            confidence = consistency * 0.5  # Lower confidence for irregular
        
        return frequency, confidence
    
    def _calculate_next_date(self, last_date: date, frequency: str) -> date:
        """Calculate next expected date based on frequency"""
        if frequency == "daily":
            return last_date + timedelta(days=1)
        elif frequency == "weekly":
            return last_date + timedelta(days=7)
        elif frequency == "monthly":
            # Add approximately one month
            if last_date.month == 12:
                return date(last_date.year + 1, 1, min(last_date.day, 28))
            else:
                return date(last_date.year, last_date.month + 1, min(last_date.day, 28))
        elif frequency == "quarterly":
            # Add 3 months
            month = last_date.month + 3
            year = last_date.year
            if month > 12:
                month -= 12
                year += 1
            return date(year, month, min(last_date.day, 28))
        elif frequency == "yearly":
            return date(last_date.year + 1, last_date.month, last_date.day)
        else:
            # Default to monthly
            if last_date.month == 12:
                return date(last_date.year + 1, 1, min(last_date.day, 28))
            else:
                return date(last_date.year, last_date.month + 1, min(last_date.day, 28))

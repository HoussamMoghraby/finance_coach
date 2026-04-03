"""
Report service for analytics and dashboard data
"""
from datetime import date, datetime, timedelta
from typing import List, Optional
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.repositories.transaction import TransactionRepository
from app.schemas.report import (
    CategoryBreakdown,
    DashboardData,
    FinancialOverview,
    MonthlyTrend,
    RecurringTransactionCandidate,
)


class ReportService:
    """Service for generating reports and analytics"""
    
    def __init__(self, db: Session):
        self.db = db
        self.transaction_repo = TransactionRepository(db)
    
    def get_financial_overview(
        self,
        user_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> FinancialOverview:
        """Get overall financial overview for a period"""
        if not start_date:
            start_date = date.today().replace(day=1)  # First day of current month
        if not end_date:
            end_date = date.today()
        
        # Calculate income and expenses
        total_income = self.transaction_repo.get_total_by_type(
            user_id, "income", start_date, end_date
        )
        total_expenses = self.transaction_repo.get_total_by_type(
            user_id, "expense", start_date, end_date
        )
        
        # Get account information
        accounts = self.db.query(Account).filter(
            Account.user_id == user_id, Account.is_active == True
        ).all()
        
        total_balance = sum(acc.current_balance for acc in accounts)
        
        return FinancialOverview(
            total_income=total_income,
            total_expenses=total_expenses,
            net_income=total_income - total_expenses,
            total_accounts=len(accounts),
            total_balance=total_balance,
            period_start=start_date,
            period_end=end_date,
        )
    
    def get_category_breakdown(
        self,
        user_id: int,
        transaction_type: str = "expense",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[CategoryBreakdown]:
        """Get spending/income breakdown by category"""
        if not start_date:
            start_date = date.today().replace(day=1)
        if not end_date:
            end_date = date.today()
        
        # Query transactions grouped by category
        results = (
            self.db.query(
                Transaction.category_id,
                Category.name.label("category_name"),
                func.sum(Transaction.amount).label("total_amount"),
                func.count(Transaction.id).label("count"),
            )
            .outerjoin(Category, Transaction.category_id == Category.id)
            .filter(
                Transaction.user_id == user_id,
                Transaction.type == transaction_type,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
            .group_by(Transaction.category_id, Category.name)
            .all()
        )
        
        # Calculate total for percentage
        total = sum(r.total_amount for r in results)
        
        # Build breakdown list
        breakdown = []
        for result in results:
            percentage = (result.total_amount / total * 100) if total > 0 else 0
            breakdown.append(
                CategoryBreakdown(
                    category_id=result.category_id,
                    category_name=result.category_name or "Uncategorized",
                    amount=result.total_amount,
                    transaction_count=result.count,
                    percentage=round(percentage, 2),
                )
            )
        
        # Sort by amount descending
        breakdown.sort(key=lambda x: x.amount, reverse=True)
        return breakdown
    
    def get_monthly_trends(
        self,
        user_id: int,
        months: int = 6,
    ) -> List[MonthlyTrend]:
        """Get monthly income/expense trends"""
        # Calculate start date (N months ago)
        end_date = date.today()
        start_date = (end_date.replace(day=1) - timedelta(days=1)).replace(day=1)
        for _ in range(months - 1):
            start_date = (start_date - timedelta(days=1)).replace(day=1)
        
        # Query transactions grouped by month
        results = (
            self.db.query(
                extract("year", Transaction.transaction_date).label("year"),
                extract("month", Transaction.transaction_date).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
            )
            .group_by("year", "month", Transaction.type)
            .all()
        )
        
        # Organize by month
        trends_dict = {}
        for result in results:
            month_key = f"{int(result.year)}-{int(result.month):02d}"
            if month_key not in trends_dict:
                trends_dict[month_key] = {"income": 0.0, "expenses": 0.0}
            
            if result.type == "income":
                trends_dict[month_key]["income"] = result.total
            elif result.type == "expense":
                trends_dict[month_key]["expenses"] = result.total
        
        # Build sorted list
        trends = []
        for month_key in sorted(trends_dict.keys()):
            data = trends_dict[month_key]
            trends.append(
                MonthlyTrend(
                    month=month_key,
                    income=data["income"],
                    expenses=data["expenses"],
                    net=data["income"] - data["expenses"],
                )
            )
        
        return trends
    
    def get_dashboard_data(
        self,
        user_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> DashboardData:
        """Get complete dashboard data"""
        overview = self.get_financial_overview(user_id, start_date, end_date)
        category_breakdown = self.get_category_breakdown(user_id, "expense", start_date, end_date)
        monthly_trends = self.get_monthly_trends(user_id, 6)
        
        return DashboardData(
            overview=overview,
            category_breakdown=category_breakdown,
            monthly_trends=monthly_trends,
        )
    
    def detect_recurring_transactions(
        self,
        user_id: int,
        min_occurrences: int = 3,
    ) -> List[RecurringTransactionCandidate]:
        """Detect potential recurring transactions"""
        # Look back 6 months
        end_date = date.today()
        start_date = end_date - timedelta(days=180)
        
        # Get all transactions grouped by merchant and similar amounts
        transactions = (
            self.db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.transaction_date >= start_date,
            )
            .order_by(Transaction.category_id, Transaction.amount, Transaction.transaction_date)
            .all()
        )
        
        # Group transactions by category
        category_groups = {}
        for txn in transactions:
            key = txn.category_id
            if key not in category_groups:
                category_groups[key] = []
            category_groups[key].append(txn)
        
        candidates = []
        
        for category_id, txns in category_groups.items():
            if len(txns) < min_occurrences:
                continue
            
            # Calculate average amount and frequency
            avg_amount = sum(t.amount for t in txns) / len(txns)
            
            # Calculate average days between transactions
            if len(txns) > 1:
                dates = sorted([t.transaction_date for t in txns])
                intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]
                avg_interval = sum(intervals) / len(intervals) if intervals else 30
                
                # Calculate confidence based on consistency
                variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
                std_dev = variance ** 0.5
                confidence = max(0, min(1, 1 - (std_dev / avg_interval)))
                
                # Get category name
                category_name = None
                if category_id:
                    category = self.db.query(Category).get(category_id)
                    category_name = category.name if category else None
                
                last_date = max(t.transaction_date for t in txns)
                next_expected = last_date + timedelta(days=int(avg_interval))
                
                candidates.append(
                    RecurringTransactionCandidate(
                        category_name=category_name,
                        average_amount=round(avg_amount, 2),
                        frequency_days=int(avg_interval),
                        occurrences=len(txns),
                        last_date=last_date,
                        next_expected_date=next_expected,
                        confidence_score=round(confidence, 2),
                    )
                )
        
        # Sort by confidence score descending
        candidates.sort(key=lambda x: x.confidence_score, reverse=True)
        return candidates

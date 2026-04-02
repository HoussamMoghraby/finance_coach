"""
AI service for generating insights and handling AI tasks
"""
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session

from app.ai.ollama import OllamaService
from app.ai.prompts import (
    BUDGET_COACHING_TEMPLATE,
    CHAT_QUESTION_TEMPLATE,
    DAILY_SUMMARY_TEMPLATE,
    MONTHLY_SUMMARY_TEMPLATE,
    SPENDING_EXPLANATION_TEMPLATE,
    SYSTEM_PROMPT,
    WEEKLY_SUMMARY_TEMPLATE,
)
from app.core.config import settings
from app.models.insight import AIInteraction
from app.services.report import ReportService
from app.services.budget import BudgetService


class AIService:
    """Service for AI-powered financial insights"""
    
    def __init__(self, db: Session):
        self.db = db
        self.ollama = OllamaService()
        self.report_service = ReportService(db)
        self.budget_service = BudgetService(db)
    
    async def _generate_and_track(
        self,
        user_id: int,
        task_type: str,
        prompt: str,
        prompt_template_name: str,
        input_summary: Optional[str] = None,
    ) -> str:
        """Generate AI response and track the interaction"""
        response, latency_ms = await self.ollama.generate(
            prompt=prompt,
            system_prompt=SYSTEM_PROMPT,
            temperature=0.7,
        )
        
        # Track interaction
        interaction = AIInteraction(
            user_id=user_id,
            task_type=task_type,
            prompt_template_name=prompt_template_name,
            model_name=settings.OLLAMA_MODEL,
            input_summary=input_summary,
            output_text=response,
            latency_ms=latency_ms,
        )
        self.db.add(interaction)
        self.db.commit()
        
        return response
    
    async def generate_daily_summary(self, user_id: int, target_date: date) -> str:
        """Generate daily financial summary"""
        overview = self.report_service.get_financial_overview(
            user_id, start_date=target_date, end_date=target_date
        )
        
        category_breakdown = self.report_service.get_category_breakdown(
            user_id, "expense", target_date, target_date
        )
        
        top_expenses_text = "\n".join(
            [f"- {c.category_name}: ${c.amount:.2f}" for c in category_breakdown[:5]]
        )
        
        prompt = DAILY_SUMMARY_TEMPLATE.format(
            date=target_date.isoformat(),
            total_income=f"{overview.total_income:.2f}",
            total_expenses=f"{overview.total_expenses:.2f}",
            net=f"{overview.net_income:.2f}",
            top_expenses=top_expenses_text or "No expenses recorded",
        )
        
        return await self._generate_and_track(
            user_id=user_id,
            task_type="daily_summary",
            prompt=prompt,
            prompt_template_name="daily_summary",
            input_summary=f"Daily summary for {target_date}",
        )
    
    async def generate_monthly_summary(
        self, user_id: int, start_date: date, end_date: date
    ) -> str:
        """Generate monthly financial summary"""
        overview = self.report_service.get_financial_overview(user_id, start_date, end_date)
        category_breakdown = self.report_service.get_category_breakdown(
            user_id, "expense", start_date, end_date
        )
        top_merchants = self.report_service.get_top_merchants(
            user_id, 10, start_date, end_date
        )
        budget_overview = self.budget_service.get_budget_overview(user_id, end_date)
        
        savings_rate = (
            (overview.net_income / overview.total_income * 100)
            if overview.total_income > 0
            else 0
        )
        
        category_text = "\n".join(
            [f"- {c.category_name}: ${c.amount:.2f} ({c.percentage:.1f}%)" 
             for c in category_breakdown[:10]]
        )
        
        merchant_text = "\n".join(
            [f"- {m.merchant_name}: ${m.amount:.2f}" for m in top_merchants[:10]]
        )
        
        budget_text = f"Overall: ${budget_overview.total_spent:.2f} / ${budget_overview.total_budget:.2f} ({budget_overview.percentage_used:.1f}%)"
        
        # Get previous month data for comparison
        from dateutil.relativedelta import relativedelta
        prev_start = start_date - relativedelta(months=1)
        prev_end = end_date - relativedelta(months=1)
        prev_overview = self.report_service.get_financial_overview(
            user_id, prev_start, prev_end
        )
        
        prompt = MONTHLY_SUMMARY_TEMPLATE.format(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            total_income=f"{overview.total_income:.2f}",
            total_expenses=f"{overview.total_expenses:.2f}",
            net=f"{overview.net_income:.2f}",
            savings_rate=f"{savings_rate:.1f}",
            category_breakdown=category_text,
            top_merchants=merchant_text or "No merchant data",
            budget_status=budget_text,
            prev_income=f"{prev_overview.total_income:.2f}",
            prev_expenses=f"{prev_overview.total_expenses:.2f}",
        )
        
        return await self._generate_and_track(
            user_id=user_id,
            task_type="monthly_summary",
            prompt=prompt,
            prompt_template_name="monthly_summary",
            input_summary=f"Monthly summary {start_date} to {end_date}",
        )
    
    async def answer_question(
        self, user_id: int, question: str, context_date: Optional[date] = None
    ) -> str:
        """Answer a user's question about their finances"""
        if not context_date:
            context_date = date.today()
        
        # Get recent financial context
        overview = self.report_service.get_financial_overview(
            user_id,
            start_date=context_date.replace(day=1),
            end_date=context_date,
        )
        
        budget_overview = self.budget_service.get_budget_overview(user_id, context_date)
        
        financial_context = f"""Current Month (as of {context_date}):
- Income: ${overview.total_income:.2f}
- Expenses: ${overview.total_expenses:.2f}
- Net: ${overview.net_income:.2f}
- Accounts Balance: ${overview.total_balance:.2f}
- Budget Used: {budget_overview.percentage_used:.1f}%"""
        
        prompt = CHAT_QUESTION_TEMPLATE.format(
            question=question,
            financial_context=financial_context,
        )
        
        return await self._generate_and_track(
            user_id=user_id,
            task_type="chat_question",
            prompt=prompt,
            prompt_template_name="chat_question",
            input_summary=f"Q: {question[:100]}",
        )
    
    async def health_check(self) -> bool:
        """Check if Ollama is available"""
        return await self.ollama.health_check()

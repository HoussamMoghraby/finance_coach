"""
Insight and AI endpoints
"""
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.insight import Insight as InsightModel
from app.schemas.insight import ChatRequest, ChatResponse, Insight, InsightGenerateRequest
from app.services.ai import AIService


router = APIRouter()


@router.get("", response_model=List[Insight])
async def get_insights(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's insights"""
    insights = (
        db.query(InsightModel)
        .filter(InsightModel.user_id == current_user.id)
        .order_by(InsightModel.created_at.desc())
        .limit(limit)
        .all()
    )
    return insights


@router.post("/generate", response_model=Insight, status_code=status.HTTP_201_CREATED)
async def generate_insight(
    request: InsightGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new AI insight"""
    ai_service = AIService(db)
    
    # Determine date range based on type
    if request.type == "daily":
        target_date = request.end_date or date.today()
        start_date = target_date
        end_date = target_date
        summary = await ai_service.generate_daily_summary(current_user.id, target_date)
        title = f"Daily Summary - {target_date.isoformat()}"
    
    elif request.type == "weekly":
        end_date = request.end_date or date.today()
        start_date = request.start_date or (end_date - timedelta(days=7))
        summary = await ai_service.generate_weekly_summary(current_user.id, start_date, end_date)
        title = f"Weekly Summary - {start_date.isoformat()} to {end_date.isoformat()}"
    
    elif request.type == "monthly":
        end_date = request.end_date or date.today()
        start_date = request.start_date or end_date.replace(day=1)
        summary = await ai_service.generate_monthly_summary(current_user.id, start_date, end_date)
        title = f"Monthly Summary - {start_date.strftime('%B %Y')}"
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid insight type. Use: daily, weekly, or monthly",
        )
    
    # Save insight
    insight = InsightModel(
        user_id=current_user.id,
        type=request.type,
        period_start=start_date,
        period_end=end_date,
        title=title,
        summary=summary,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    
    return insight


@router.post("/budget-coaching", response_model=ChatResponse)
async def get_budget_coaching(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI budget coaching advice"""
    ai_service = AIService(db)
    
    try:
        advice = await ai_service.generate_budget_coaching(
            current_user.id, request.question
        )
        return ChatResponse(answer=advice)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate budget coaching: {str(e)}",
        )


@router.post("/ask", response_model=ChatResponse)
async def ask_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ask AI a question about finances"""
    ai_service = AIService(db)
    
    try:
        answer = await ai_service.answer_question(current_user.id, request.question)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}",
        )


@router.get("/health")
async def ai_health_check():
    """Check if Ollama is available"""
    ai_service = AIService(None)  # No DB needed for health check
    is_healthy = await ai_service.health_check()
    
    if is_healthy:
        return {"status": "healthy", "ollama": "connected"}
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama service is not available",
        )

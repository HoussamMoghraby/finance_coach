"""
Admin and System Operations endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, get_current_admin_user
from app.models.user import User
from app.services.ai import AIService
from app.db.seed import seed_categories
from app.repositories.insight import InsightRepository
from datetime import datetime, timedelta


router = APIRouter()


@router.post("/seed-categories", status_code=status.HTTP_201_CREATED)
def seed_default_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Seed default system categories.
    
    Admin only endpoint to initialize default expense and income categories.
    This is idempotent - it will skip seeding if categories already exist.
    """
    try:
        seed_categories(db)
        return {
            "status": "success",
            "message": "Default categories seeded successfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed categories: {str(e)}",
        )


@router.get("/ai/health")
async def check_ai_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Check AI model connectivity.
    
    Admin only endpoint to verify Ollama is running and accessible.
    """
    try:
        ai_service = AIService(db)
        is_healthy = await ai_service.health_check()
        
        if is_healthy:
            return {
                "status": "healthy",
                "service": "ollama",
                "message": "AI service is connected and responding",
            }
        else:
            return {
                "status": "unhealthy",
                "service": "ollama",
                "message": "AI service is not responding",
            }
    except Exception as e:
        return {
            "status": "error",
            "service": "ollama",
            "message": f"Error checking AI health: {str(e)}",
        }


@router.get("/insights/job-status")
def get_insight_job_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Get scheduled insight generation job status.
    
    Admin only endpoint to view statistics about insight generation:
    - Total insights generated
    - Recent insights by type
    - Last generation times
    """
    try:
        insight_repo = InsightRepository(db)
        
        # Get counts by type for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get all insights from the last 30 days
        all_recent = db.query(insight_repo.model).filter(
            insight_repo.model.created_at >= thirty_days_ago
        ).all()
        
        # Count by type
        daily_count = sum(1 for i in all_recent if i.type == "daily")
        weekly_count = sum(1 for i in all_recent if i.type == "weekly")
        monthly_count = sum(1 for i in all_recent if i.type == "monthly")
        
        # Get latest insight by type
        latest_daily = db.query(insight_repo.model).filter(
            insight_repo.model.type == "daily"
        ).order_by(insight_repo.model.created_at.desc()).first()
        
        latest_weekly = db.query(insight_repo.model).filter(
            insight_repo.model.type == "weekly"
        ).order_by(insight_repo.model.created_at.desc()).first()
        
        latest_monthly = db.query(insight_repo.model).filter(
            insight_repo.model.type == "monthly"
        ).order_by(insight_repo.model.created_at.desc()).first()
        
        return {
            "status": "operational",
            "statistics": {
                "last_30_days": {
                    "daily_insights": daily_count,
                    "weekly_insights": weekly_count,
                    "monthly_insights": monthly_count,
                    "total": len(all_recent),
                },
                "last_generated": {
                    "daily": latest_daily.created_at.isoformat() if latest_daily else None,
                    "weekly": latest_weekly.created_at.isoformat() if latest_weekly else None,
                    "monthly": latest_monthly.created_at.isoformat() if latest_monthly else None,
                },
            },
            "message": "Insight generation is handled on-demand via API endpoints",
            "note": "For production deployment, consider implementing scheduled jobs using APScheduler, Celery, or cloud-native schedulers",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve insight job status: {str(e)}",
        )


@router.get("/system/info")
def get_system_info(
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Get system information.
    
    Admin only endpoint to view basic system configuration and status.
    """
    from app.core.config import settings
    
    return {
        "app": "AI Personal Finance & Spending Coach",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "database": {
            "type": "PostgreSQL",
            "url": settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[0].split('://')[1], '***') if '@' in settings.DATABASE_URL else "***",
        },
        "ai": {
            "provider": "Ollama",
            "model": settings.OLLAMA_MODEL,
        },
        "features": {
            "accounts": True,
            "transactions": True,
            "budgets": True,
            "recurring_detection": True,
            "insights": True,
            "notifications": True,
            "ai_chat": True,
        },
    }

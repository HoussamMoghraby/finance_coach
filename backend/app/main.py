"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="AI Personal Finance & Spending Coach API",
    description="Production-style personal finance management with AI insights",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.BACKEND_CORS_ORIGINS if settings.ENVIRONMENT == "production" else [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # Network access for mobile testing
    "http://192.168.0.253:5173",
    "http://192.168.0.253:5174",
    "http://192.168.0.253:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "AI Personal Finance & Spending Coach",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """
    Basic health check endpoint.
    
    Returns 200 OK if the application is running.
    For detailed checks including database and AI, use /ready endpoint.
    """
    return {
        "status": "healthy",
        "app": "AI Personal Finance & Spending Coach",
        "version": "0.1.0",
    }


@app.get("/ready")
async def readiness_check():
    """
    Comprehensive readiness check endpoint.
    
    Checks:
    - Application status
    - Database connectivity
    - AI service availability
    """
    from sqlalchemy import text
    from app.db.session import SessionLocal
    from app.services.ai import AIService
    
    checks = {
        "application": "ready",
        "database": "unknown",
        "ai_service": "unknown",
    }
    
    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["database"] = "connected"
    except Exception as e:
        checks["database"] = f"error: {str(e)[:100]}"
    
    # Check AI service
    try:
        db = SessionLocal()
        ai_service = AIService(db)
        is_healthy = await ai_service.health_check()
        db.close()
        checks["ai_service"] = "connected" if is_healthy else "not responding"
    except Exception as e:
        checks["ai_service"] = f"error: {str(e)[:100]}"
    
    # Determine overall status
    all_ready = (
        checks["database"] == "connected" and 
        checks["ai_service"] == "connected"
    )
    
    return {
        "status": "ready" if all_ready else "degraded",
        "checks": checks,
    }


# Import and include routers
from app.api.v1.api import api_router

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

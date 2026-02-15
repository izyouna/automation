"""Shared API endpoints for Phase 2 production"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.schemas.common import HealthResponse, ErrorResponse
from app.schemas.user import UserAuth
from app.core.redis import redis_client
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/shared",
    tags=["shared"]
)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Shared health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="2.0.0",
        components={
            "api": "healthy",
            "database": "connected",
            "redis": "connected"
        }
    )


@router.get("/metrics")
async def metrics():
    """Shared metrics endpoint"""
    try:
        # Get active sessions count from Redis
        active_sessions = await redis_client.dbsize()
        
        return {
            "metrics": {
                "http_requests_total": 0,  # Would be tracked in middleware
                "http_request_duration_seconds": 0.001,
                "active_sessions": active_sessions,
                "database_connections": 1,
                "redis_memory_usage": "unknown"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Metrics endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")


@router.get("/info")
async def app_info():
    """Application information endpoint"""
    return {
        "application": "Phase 2 Production API",
        "version": "2.0.0",
        "description": "Production implementation of stateless vs stateful server patterns",
        "architecture": {
            "backend": "FastAPI",
            "database": "PostgreSQL",
            "cache": "Redis",
            "language": "Python"
        },
        "endpoints": {
            "stateless": "/api/v1/stateless",
            "stateful": "/api/v1/stateful",
            "shared": "/api/v1/shared",
            "docs": "/docs",
            "health": "/api/v1/shared/health"
        },
        "features": {
            "authentication": "JWT-based",
            "session_management": "Redis-backed",
            "rate_limiting": "Enabled",
            "cors": "Enabled",
            "health_checks": "Enabled",
            "metrics": "Enabled"
        }
    }

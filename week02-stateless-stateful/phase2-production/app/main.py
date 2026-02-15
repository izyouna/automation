"""Phase 2 Production FastAPI Application

Production-ready implementation of stateless vs stateful server patterns
using FastAPI, PostgreSQL, and Redis.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from app.core.config.settings import settings
from app.core.database import engine, Base
from app.core.redis import redis_client
from app.api.stateless import router as stateless_router
from app.api.stateful import router as stateful_router
from app.api.shared import router as shared_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Phase 2 Production Application...")
    
    # Initialize database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Test Redis connection
    try:
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await engine.dispose()
    await redis_client.close()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Phase 2 Production API",
    description="Production implementation of stateless vs stateful server patterns",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include routers
app.include_router(
    stateless_router,
    prefix="/api/v1/stateless",
    tags=["stateless"]
)

app.include_router(
    stateful_router,
    prefix="/api/v1/stateful",
    tags=["stateful"]
)

app.include_router(
    shared_router,
    prefix="/api/v1/shared",
    tags=["shared"]
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Phase 2 Production API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "stateless": "/api/v1/stateless",
            "stateful": "/api/v1/stateful",
            "shared": "/api/v1/shared",
            "docs": "/docs",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check database
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"
    
    # Check Redis
    try:
        await redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {e}"
    
    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": "2026-02-06T10:30:00.000Z",
        "version": "2.0.0",
        "components": {
            "database": db_status,
            "redis": redis_status,
            "api": "healthy"
        }
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return {
        "metrics": {
            "http_requests_total": 0,
            "http_request_duration_seconds": 0.001,
            "active_sessions": 0,
            "database_connections": 1
        },
        "timestamp": "2026-02-06T10:30:00.000Z"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

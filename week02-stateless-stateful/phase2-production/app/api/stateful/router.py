"""Stateful API endpoints for Phase 2 production"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.redis import set_session, get_session, delete_session, extend_session
from app.models.user import User
from app.models.product import Product
from app.schemas.common import HealthResponse
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate
from app.schemas.user import UserResponse
from app.schemas.product import ProductResponse
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/stateful",
    tags=["stateful"]
)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Stateful server health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="2.0.0",
        components={
            "api": "healthy",
            "database": "connected",
            "redis": "connected",
            "stateful_mode": "enabled"
        }
    )


@router.post("/sessions", response_model=SessionResponse)
async def create_session(user_id: int):
    """Create new session"""
    try:
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "user_id": user_id,
            "session_data": {},
            "visit_count": 1,
            "is_active": True,
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        success = await set_session(session_id, session_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create session")
        
        return SessionResponse(**session_data)
        
    except Exception as e:
        logger.error(f"Create session error: {e}")
        raise HTTPException(status_code=500, detail="Session creation failed")


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_by_id(session_id: str):
    """Get session by ID"""
    try:
        session_data = await get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return SessionResponse(**session_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session")


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, update_data: SessionUpdate):
    """Update session data"""
    try:
        session_data = await get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update session data
        if update_data.session_data is not None:
            session_data["session_data"].update(update_data.session_data)
        if update_data.is_active is not None:
            session_data["is_active"] = update_data.is_active
        
        session_data["updated_at"] = datetime.utcnow().isoformat()
        session_data["visit_count"] += 1
        
        success = await set_session(session_id, session_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update session")
        
        return SessionResponse(**session_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update session error: {e}")
        raise HTTPException(status_code=500, detail="Session update failed")


@router.delete("/sessions/{session_id}")
async def delete_session_by_id(session_id: str):
    """Delete session"""
    try:
        success = await delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete session error: {e}")
        raise HTTPException(status_code=500, detail="Session deletion failed")


@router.post("/cart/{session_id}")
async def add_to_cart(session_id: str, product_id: int, quantity: int = 1):
    """Add item to shopping cart"""
    try:
        session_data = await get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get cart from session data
        cart = session_data["session_data"].get("cart", [])
        
        # Check if product already in cart
        for item in cart:
            if item["product_id"] == product_id:
                item["quantity"] += quantity
                break
        else:
            cart.append({"product_id": product_id, "quantity": quantity})
        
        session_data["session_data"]["cart"] = cart
        session_data["updated_at"] = datetime.utcnow().isoformat()
        
        success = await set_session(session_id, session_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update cart")
        
        return {"message": "Item added to cart", "cart": cart}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add to cart")


@router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    """Get shopping cart contents"""
    try:
        session_data = await get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        cart = session_data["session_data"].get("cart", [])
        return {"cart": cart, "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve cart")

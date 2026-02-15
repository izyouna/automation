"""Session schemas for Phase 2 production API"""

from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime


class SessionBase(BaseModel):
    """Base session schema with common fields"""
    user_id: int
    session_data: Optional[Dict[str, Any]] = {}
    visit_count: int = 0
    is_active: bool = True


class SessionCreate(SessionBase):
    """Schema for creating new sessions"""
    pass


class SessionUpdate(BaseModel):
    """Schema for updating existing sessions"""
    session_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class SessionResponse(SessionBase):
    """Schema for session responses (includes timestamps)"""
    id: str
    expires_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionExtension(BaseModel):
    """Schema for extending session TTL"""
    minutes: int = 30


@validator('session_data')
def validate_session_data(cls, v):
    """Validate session_data field"""
    if v is None:
        return {}
    if not isinstance(v, dict):
        raise ValueError('Session data must be a dictionary')
    return v


@validator('minutes')
def validate_extension_minutes(cls, v):
    """Validate extension minutes"""
    if v is not None and (v < 1 or v > 1440):  # Max 24 hours
        raise ValueError('Extension minutes must be between 1 and 1440')
    return v

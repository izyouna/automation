"""User schemas for Phase 2 production API"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    name: str
    email: EmailStr
    preferences: Optional[Dict[str, Any]] = {}
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating new users"""
    pass


class UserUpdate(BaseModel):
    """Schema for updating existing users"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferences: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user responses (includes timestamps)"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    # Password would be handled separately for security


class UserAuth(BaseModel):
    """Schema for authenticated user"""
    id: int
    name: str
    email: EmailStr
    preferences: Dict[str, Any]


@validator('preferences', pre=True)
def validate_preferences(cls, v):
    """Validate preferences field"""
    if v is None:
        return {}
    if not isinstance(v, dict):
        raise ValueError('Preferences must be a dictionary')
    return v

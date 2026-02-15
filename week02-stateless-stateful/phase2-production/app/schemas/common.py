"""Common schemas for Phase 2 production API"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class HealthResponse(BaseModel):
    """Schema for health check responses"""
    status: str
    timestamp: datetime
    version: str
    components: Dict[str, str]


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime


class SuccessResponse(BaseModel):
    """Schema for success responses"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime


class PaginatedResponse(BaseModel):
    """Schema for paginated responses"""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class CalculationRequest(BaseModel):
    """Schema for calculation requests"""
    operation: str
    operand1: float
    operand2: Optional[float] = None


class CalculationResponse(BaseModel):
    """Schema for calculation responses"""
    operation: str
    result: float
    operand1: float
    operand2: Optional[float] = None
    timestamp: datetime


class RandomDataRequest(BaseModel):
    """Schema for random data generation requests"""
    type: str
    count: int = 1
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class RandomDataResponse(BaseModel):
    """Schema for random data responses"""
    type: str
    data: List[Any]
    count: int
    timestamp: datetime

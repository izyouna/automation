"""Product schemas for Phase 2 production API"""

from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    name: str
    category: str
    price: float
    description: Optional[str] = ""
    stock: int = 100
    is_available: bool = True


class ProductCreate(ProductBase):
    """Schema for creating new products"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating existing products"""
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    is_available: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for product responses (includes timestamps)"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductStockUpdate(BaseModel):
    """Schema for updating product stock"""
    quantity: int


class ProductSearch(BaseModel):
    """Schema for product search filters"""
    name: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    limit: int = 50


@validator('price')
def validate_price(cls, v):
    """Validate price field"""
    if v is not None and v < 0:
        raise ValueError('Price must be non-negative')
    return v


@validator('stock')
def validate_stock(cls, v):
    """Validate stock field"""
    if v is not None and v < 0:
        raise ValueError('Stock must be non-negative')
    return v

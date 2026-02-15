"""Product model for Phase 2 production"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class Product(Base):
    """Product model for catalog and shopping cart functionality"""
    
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    description = Column(Text, default="")
    stock = Column(Integer, default=100, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', category='{self.category}', price={self.price})>"
    
    def to_dict(self):
        """Convert product to dictionary for API responses"""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "description": self.description,
            "stock": self.stock,
            "is_available": self.is_available,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_in_stock(self, quantity=1):
        """Check if product is available in requested quantity"""
        return self.is_available and self.stock >= quantity
    
    def reduce_stock(self, quantity):
        """Reduce stock by quantity, return success status"""
        if self.is_in_stock(quantity):
            self.stock -= quantity
            if self.stock == 0:
                self.is_available = False
            return True
        return False

"""Stateless API endpoints for Phase 2 production"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_async_session
from app.models.user import User
from app.models.product import Product
from app.schemas.common import HealthResponse, ErrorResponse, CalculationRequest, CalculationResponse, RandomDataRequest, RandomDataResponse
from app.schemas.user import UserResponse
from app.schemas.product import ProductResponse, ProductSearch
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/stateless",
    tags=["stateless"]
)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Stateless server health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="2.0.0",
        components={
            "api": "healthy",
            "database": "connected",
            "stateless_mode": "enabled"
        }
    )


@router.get("/info")
async def server_info():
    """Stateless server information"""
    return {
        "server": "Phase 2 Stateless Server",
        "mode": "stateless",
        "description": "Stateless API server - no session persistence between requests",
        "capabilities": [
            "calculations",
            "random_data_generation",
            "user_data_access",
            "product_catalog",
            "api_documentation"
        ],
        "endpoints": {
            "health": "/health",
            "calculate": "/calculate",
            "random": "/random",
            "users": "/users",
            "products": "/products"
        },
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/calculate", response_model=CalculationResponse)
async def calculate(request: CalculationRequest):
    """Perform calculation operations (stateless)"""
    try:
        if request.operation == "add":
            result = request.operand1 + (request.operand2 or 0)
        elif request.operation == "subtract":
            result = request.operand1 - (request.operand2 or 0)
        elif request.operation == "multiply":
            result = request.operand1 * (request.operand2 or 1)
        elif request.operation == "divide":
            if request.operand2 == 0:
                raise HTTPException(status_code=400, detail="Division by zero not allowed")
            result = request.operand1 / request.operand2
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {request.operation}")
        
        return CalculationResponse(
            operation=request.operation,
            result=result,
            operand1=request.operand1,
            operand2=request.operand2,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        raise HTTPException(status_code=500, detail="Calculation failed")


@router.get("/random", response_model=RandomDataResponse)
async def generate_random_data(
    type: str = Query(..., description="Type of random data to generate"),
    count: int = Query(1, ge=1, le=100, description="Number of items to generate"),
    min_value: float = Query(None, description="Minimum value for numeric types"),
    max_value: float = Query(None, description="Maximum value for numeric types")
):
    """Generate random data (stateless)"""
    try:
        data = []
        
        for _ in range(count):
            if type == "number":
                min_val = min_value or 0
                max_val = max_value or 100
                value = random.uniform(min_val, max_val)
                data.append(value)
                
            elif type == "string":
                length = random.randint(5, 20)
                chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                value = ''.join(random.choice(chars) for _ in range(length))
                data.append(value)
                
            elif type == "boolean":
                value = random.choice([True, False])
                data.append(value)
                
            elif type == "uuid":
                import uuid
                value = str(uuid.uuid4())
                data.append(value)
                
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported data type: {type}")
        
        return RandomDataResponse(
            type=type,
            data=data,
            count=count,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Random data generation error: {e}")
        raise HTTPException(status_code=500, detail="Random data generation failed")


@router.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of users to return")
):
    """Get users list (stateless)"""
    try:
        async with get_async_session() as session:
            result = await session.execute(
                select(User)
                .offset(skip)
                .limit(limit)
                .order_by(User.id)
            )
            users = result.scalars().all()
            
            return [UserResponse.from_orm(user) for user in users]
            
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@router.get("/products", response_model=list[ProductResponse])
async def get_products(
    category: str = Query(None, description="Filter by product category"),
    min_price: float = Query(None, ge=0, description="Minimum price filter"),
    max_price: float = Query(None, ge=0, description="Maximum price filter"),
    in_stock: bool = Query(None, description="Filter by stock availability"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of products to return")
):
    """Get products list (stateless)"""
    try:
        async with get_async_session() as session:
            query = select(Product)
            
            # Apply filters
            if category:
                query = query.where(Product.category == category)
            if min_price is not None:
                query = query.where(Product.price >= min_price)
            if max_price is not None:
                query = query.where(Product.price <= max_price)
            if in_stock is not None:
                query = query.where(Product.is_available == in_stock)
            
            result = await session.execute(
                query
                .limit(limit)
                .order_by(Product.name)
            )
            products = result.scalars().all()
            
            return [ProductResponse.from_orm(product) for product in products]
            
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve products")

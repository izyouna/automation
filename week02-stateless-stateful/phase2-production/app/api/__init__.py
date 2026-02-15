"""API routers for Phase 2 production"""

from .stateless import router as stateless_router
from .stateful import router as stateful_router
from .shared import router as shared_router

__all__ = ["stateless_router", "stateful_router", "shared_router"]

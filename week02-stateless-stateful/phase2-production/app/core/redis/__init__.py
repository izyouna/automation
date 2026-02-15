"""Redis connection and management for Phase 2 production"""

from .connection import redis_client, get_redis_client

__all__ = ["redis_client", "get_redis_client"]

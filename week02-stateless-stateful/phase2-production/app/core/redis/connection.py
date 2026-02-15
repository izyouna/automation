"""Redis connection setup for Phase 2 production"""

import redis.asyncio as redis
from app.core.config.settings import settings
import logging
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Create Redis client
redis_client = redis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True,
    health_check_interval=30,
)


async def get_redis_client():
    """Get Redis client (connection pool managed)"""
    return redis_client


async def set_session(session_id: str, session_data: Dict[str, Any], ttl: Optional[int] = None):
    """Store session data in Redis"""
    try:
        await redis_client.setex(
            f"session:{session_id}",
            ttl or settings.redis_session_ttl,
            json.dumps(session_data)
        )
        logger.debug(f"Session stored: {session_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to store session {session_id}: {e}")
        return False


async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve session data from Redis"""
    try:
        data = await redis_client.get(f"session:{session_id}")
        if data:
            logger.debug(f"Session retrieved: {session_id}")
            return json.loads(data)
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve session {session_id}: {e}")
        return None


async def delete_session(session_id: str) -> bool:
    """Delete session from Redis"""
    try:
        result = await redis_client.delete(f"session:{session_id}")
        if result:
            logger.debug(f"Session deleted: {session_id}")
        return result > 0
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}")
        return False


async def extend_session(session_id: str, minutes: int = 30) -> bool:
    """Extend session TTL"""
    try:
        await redis_client.expire(f"session:{session_id}", minutes * 60)
        logger.debug(f"Session extended: {session_id} by {minutes} minutes")
        return True
    except Exception as e:
        logger.error(f"Failed to extend session {session_id}: {e}")
        return False


async def is_session_valid(session_id: str) -> bool:
    """Check if session exists and is valid"""
    try:
        ttl = await redis_client.ttl(f"session:{session_id}")
        return ttl > 0
    except Exception as e:
        logger.error(f"Failed to check session validity {session_id}: {e}")
        return False


async def cleanup_expired_sessions() -> int:
    """Clean up expired sessions (maintenance task)"""
    try:
        # This would typically use Redis keys with pattern matching
        # For now, return count of active sessions
        active_sessions = await redis_client.dbsize()
        logger.info(f"Active sessions count: {active_sessions}")
        return active_sessions
    except Exception as e:
        logger.error(f"Failed to cleanup sessions: {e}")
        return 0


async def close_redis():
    """Close Redis connection"""
    await redis_client.close()
    logger.info("Redis connection closed")

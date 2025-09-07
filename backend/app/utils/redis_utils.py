import asyncio
import redis

from app.config import REDIS_URL
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

redis_client = None

async def get_redis_client():
    """Get Redis client instance."""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(REDIS_URL or "redis://localhost:6379")
            await redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Proceeding without cache.")
            redis_client = None
    return redis_client
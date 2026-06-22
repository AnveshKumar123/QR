from fastapi import Request, HTTPException
import time, hashlib
from core.logging import logger
from core.config import settings
import redis.asyncio as redis

redis_client: redis.Redis | None = None

async def get_redis_client():
    global redis_client
    if not settings.REDIS_ENABLED:
        return None
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client

def rate_limit_dependency(max_calls: int, period: int):
    async def dependency(request: Request):
        if not request.client:
            raise HTTPException(status_code=401, detail="client info missing")

        client = request.client.host
        key = f"rate_limit:{hashlib.sha256(client.encode()).hexdigest()}"
        now = time.time()

        r = await get_redis_client()
        
        if r:
            # Redis-based rate limiting
            pipe = r.pipeline()
            pipe.zremrangebyscore(key, 0, now - period)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, period)
            results = await pipe.execute()
            
            count = results[1]
            if count >= max_calls:
                logger.warning("Rate limit exceeded", extra={"ip": client})
                raise HTTPException(status_code=429, detail="limit_exceeded")
        else:
            # Fallback to in-memory for development
            if not hasattr(rate_limit_dependency, 'ip_dict'):
                rate_limit_dependency.ip_dict = {}
            
            timestamps = rate_limit_dependency.ip_dict.setdefault(key, [])
            timestamps[:] = [t for t in timestamps if now - t < period]

            if len(timestamps) >= max_calls:
                logger.warning("Rate limit exceeded", extra={"ip": client})
                raise HTTPException(status_code=429, detail="limit_exceeded")

            timestamps.append(now)

    return dependency

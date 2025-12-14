"""Redis caching service with in-memory fallback."""
import json
from typing import Optional, Any, Dict, List
from app.config import get_settings

settings = get_settings()

# In-memory storage fallback
_memory_store: Dict[str, Any] = {}


class CacheService:
    """Redis cache service with in-memory fallback for development."""
    
    def __init__(self):
        self.redis = None
        self.use_memory = True  # Start with memory, try Redis on connect
    
    async def connect(self):
        """Connect to Redis or fall back to memory."""
        try:
            import redis.asyncio as redis_lib
            self.redis = redis_lib.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.redis.ping()
            self.use_memory = False
            print("✅ Connected to Redis")
        except Exception as e:
            print(f"⚠️ Redis unavailable ({e}), using in-memory cache")
            self.use_memory = True
            self.redis = None
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
            self.redis = None
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if self.use_memory:
            value = _memory_store.get(key)
            if value and isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return value
        
        await self.connect()
        if self.redis:
            value = await self.redis.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        if ttl is None:
            ttl = settings.CACHE_TTL
        
        json_value = json.dumps(value) if isinstance(value, (dict, list)) else value
        
        if self.use_memory:
            _memory_store[key] = json_value
            return True
        
        await self.connect()
        if self.redis:
            return await self.redis.set(key, json_value, ex=ttl)
        return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if self.use_memory:
            if key in _memory_store:
                del _memory_store[key]
                return True
            return False
        
        await self.connect()
        if self.redis:
            return await self.redis.delete(key) > 0
        return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if self.use_memory:
            return key in _memory_store
        
        await self.connect()
        if self.redis:
            return await self.redis.exists(key) > 0
        return False
    
    # Video-specific methods
    async def get_video(self, video_id: str) -> Optional[dict]:
        """Get video data from cache."""
        return await self.get(f"video:{video_id}")
    
    async def set_video(self, video_id: str, video_data: dict) -> bool:
        """Set video data in cache."""
        return await self.set(f"video:{video_id}", video_data)
    
    async def delete_video(self, video_id: str) -> bool:
        """Delete video data from cache."""
        return await self.delete(f"video:{video_id}")
    
    async def list_video_ids(self) -> List[str]:
        """List all video IDs from cache."""
        if self.use_memory:
            return [k.replace("video:", "") for k in _memory_store.keys() if k.startswith("video:")]
        
        await self.connect()
        if self.redis:
            keys = await self.redis.keys("video:*")
            return [k.decode().replace("video:", "") if isinstance(k, bytes) else k.replace("video:", "") for k in keys]
        return []
    
    # Chat history methods
    async def get_chat_history(self, video_id: str) -> Optional[list]:
        """Get chat history for a video."""
        return await self.get(f"chat:{video_id}")
    
    async def add_chat_message(self, video_id: str, message: dict) -> bool:
        """Add message to chat history."""
        history = await self.get_chat_history(video_id) or []
        history.append(message)
        return await self.set(f"chat:{video_id}", history)
    
    async def clear_chat_history(self, video_id: str) -> bool:
        """Clear chat history for a video."""
        return await self.delete(f"chat:{video_id}")


# Singleton instance
cache_service = CacheService()

import json
import httpx
from redis import Redis

from fastapi import APIRouter, HTTPException

from app.config import PEXELS_API_KEY, REDIS_URL
from app.utils.logging import setup_logger

router = APIRouter()

logger = setup_logger(__name__)

redis_client = Redis.from_url(REDIS_URL)

@router.get("/")
async def get_pexels_image(query: str, per_page: int = 1):
    """
    Get a single image from Pexels API based on the query.

    - **query**: The search term for the image.
    - **per_page**: Number of images to return (default is 1).
    """
    try:
        if not PEXELS_API_KEY:
            raise HTTPException(status_code=500, detail="Pexels API key not configured.")

        cache_key = f"pexels_image:{query}:{per_page}"
        cached_data = redis_client.get(cache_key)

        if cached_data:
            return json.loads(cached_data)

        headers = {
            "Authorization": PEXELS_API_KEY
        }
        params = {
            "query": query,
            "per_page": per_page,
            "orientation": "landscape"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get("https://api.pexels.com/v1/search", headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

        if data and data.get("photos"):
            image_url = data["photos"][0]["src"]["large"]
            redis_client.setex(cache_key, 3600, json.dumps({"image_url": image_url})) # Cache for 1 hour
            return {"image_url": image_url}
        else:
            raise HTTPException(status_code=404, detail="No image found for the given query.")
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching image from Pexels API for query {query}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching image from Pexels API")

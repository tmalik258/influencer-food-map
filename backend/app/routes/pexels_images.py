from fastapi import APIRouter, HTTPException, Depends
from redis import Redis
from typing import Optional
import httpx
import json
import os

from app.config import PEXELS_API_KEY, REDIS_URL

router = APIRouter()
redis_client = Redis.from_url(REDIS_URL)

@router.get("/")
async def get_pexels_image(query: str, per_page: int = 1):
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
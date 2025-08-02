import redis
import asyncio

from fastapi import (APIRouter, Depends, BackgroundTasks, HTTPException, status)

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import (REDIS_URL, SCRAPE_YOUTUBE_LOCK, TRANSCRIPTION_NLP_LOCK)
from app.database import (AsyncSessionLocal, get_db, get_async_db)
from app.services import (scrape_youtube, transcription_nlp_pipeline)

router = APIRouter()

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

@router.post("/scrape-youtube")
async def trigger_scrape(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger YouTube scraping in the background with Redis lock."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(SCRAPE_YOUTUBE_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube scraping is already running. Please wait until the current task completes."
        )
    
    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(SCRAPE_YOUTUBE_LOCK, 3600, "locked")
    try:
        background_tasks.add_task(scrape_youtube, db)
        return {"message": "YouTube scraping started in the background"}
    except Exception as e:
        redis_client.delete(SCRAPE_YOUTUBE_LOCK)  # Release lock on error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraping: {str(e)}"
        )

@router.post("/videos-async")
async def trigger_transcription_nlp(db: AsyncSession = Depends(get_async_db)):
    """Trigger asynchronous video transcription and NLP processing with Redis lock."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(TRANSCRIPTION_NLP_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Video transcription and NLP processing is already running. Please wait until the current task completes."
        )

    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(TRANSCRIPTION_NLP_LOCK, 3600, "locked")

    async def run_pipeline():
        try:
            async with AsyncSessionLocal() as session:
                await transcription_nlp_pipeline(session)
        finally:
            redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock when done

    task = asyncio.create_task(run_pipeline())
    return {"message": "Video transcription and NLP processing started in the background", "task_id": id(task)}

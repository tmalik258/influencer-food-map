import asyncio

from fastapi import APIRouter, Depends, BackgroundTasks

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, get_db, get_async_db
from app.services.youtube_scraper import scrape_youtube
from app.scripts.transcription_nlp import transcription_nlp_pipeline

router = APIRouter()

@router.post("/scrape-youtube")
async def trigger_scrape(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(scrape_youtube, db)
    return {"message": "YouTube scraping started in the background"}

@router.post("/videos-async")
async def trigger_transcription_nlp(db: AsyncSession = Depends(get_async_db)):
    """Trigger asynchronous video transcription and NLP processing using asyncio."""
    async def run_pipeline():
        async with AsyncSessionLocal() as session:
            await transcription_nlp_pipeline(session)

    task = asyncio.create_task(run_pipeline())
    return {"message": "Video transcription and NLP processing started in the background", "task_id": id(task)}
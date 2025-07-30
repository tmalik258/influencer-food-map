from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.transcription_nlp import transcription_nlp_pipeline
from app.database import get_async_db
import asyncio

router = APIRouter()

@router.post("/videos-async")
async def trigger_transcription_nlp(db: AsyncSession = Depends(get_async_db)):
    """Trigger asynchronous video transcription and NLP processing using asyncio."""
    task = asyncio.create_task(transcription_nlp_pipeline(db))
    return {"message": "Video transcription and NLP processing started in the background", "task_id": id(task)}
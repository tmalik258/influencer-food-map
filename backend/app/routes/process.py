import redis
import asyncio
import json
import time
from typing import Optional

from fastapi import (APIRouter, Depends, BackgroundTasks, HTTPException, status)

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import (REDIS_URL, SCRAPE_YOUTUBE_LOCK, TRANSCRIPTION_NLP_LOCK, INFLUENCER_CHANNELS)
from app.database import (AsyncSessionLocal, get_db, get_async_db)
from app.services import (scrape_youtube, transcription_nlp_pipeline, JobService)
from app.models.job import JobType, JobStatus
from app.api_schema.jobs import JobCreateRequest

router = APIRouter()

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

@router.post("/scrape-youtube")
async def trigger_scrape(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger YouTube scraping in the background with Redis lock and job tracking."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(SCRAPE_YOUTUBE_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube scraping is already running. Please wait until the current task completes."
        )
    
    # Create a job to track this process
    job_data = JobCreateRequest(
        job_type=JobType.SCRAPE_YOUTUBE,
        title="YouTube Video Scraping",
        description="Scraping new videos from YouTube channels",
        redis_lock_key=SCRAPE_YOUTUBE_LOCK,
        started_by="system"
    )
    
    job = JobService.create_job_sync(db, job_data)
    
    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(SCRAPE_YOUTUBE_LOCK, 3600, "locked")
    
    async def scrape_with_job_tracking():
        start_time = time.time()
        last_heartbeat = start_time
        
        try:
            # Start the job
            JobService.start_job_sync(db, job.id)
            
            # Initialize progress tracking
            JobService.update_progress_sync(db, job.id, 0, 0)
            JobService.update_queue_size_sync(db, job.id, len(INFLUENCER_CHANNELS))
            
            # Run the scraping with monitoring
            async def monitored_scrape():
                nonlocal last_heartbeat
                
                for i, channel in enumerate(INFLUENCER_CHANNELS):
                    # Check for cancellation
                    current_job = JobService.get_job_sync(db, job.id)
                    if current_job and current_job.cancellation_requested:
                        JobService.cancel_job_sync(db, job.id, "Job cancelled by user request")
                        redis_client.delete(SCRAPE_YOUTUBE_LOCK)
                        return {"cancelled": True}
                    
                    # Update progress
                    progress = int((i / len(INFLUENCER_CHANNELS)) * 100)
                    JobService.update_progress_sync(db, job.id, progress, i)
                    
                    # Heartbeat update every 30 seconds
                    current_time = time.time()
                    if current_time - last_heartbeat > 30:
                        JobService.update_heartbeat_sync(db, job.id)
                        last_heartbeat = current_time
                    
                    # Process channel (this would be integrated into scrape_youtube)
                    # For now, we'll call the original function
                
                return await scrape_youtube(db)
            
            result = await monitored_scrape()
            
            if result and result.get("cancelled"):
                return
            
            # Complete the job
            elapsed_time = time.time() - start_time
            result_data = json.dumps({
                "message": "YouTube scraping completed successfully",
                "elapsed_time": elapsed_time,
                "channels_processed": len(INFLUENCER_CHANNELS)
            })
            JobService.complete_job_sync(db, job.id, result_data)
            
        except Exception as e:
            # Check if it's a cancellation
            if "cancelled" in str(e).lower():
                JobService.cancel_job_sync(db, job.id, str(e))
            else:
                JobService.fail_job_sync(db, job.id, str(e))
            redis_client.delete(SCRAPE_YOUTUBE_LOCK)  # Release lock on error
            raise
    
    try:
        background_tasks.add_task(scrape_with_job_tracking)
        return {
            "message": "YouTube scraping started in the background",
            "job_id": str(job.id)
        }
    except Exception as e:
        redis_client.delete(SCRAPE_YOUTUBE_LOCK)  # Release lock on error
        JobService.fail_job_sync(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraping: {str(e)}"
        )

@router.post("/scrape-listings")
async def trigger_transcription_nlp(
    release_lock: bool = False,
    db: AsyncSession = Depends(get_async_db)
):
    """Trigger asynchronous video transcription and NLP processing with Redis lock and job tracking."""
    if release_lock:
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock if requested
        # return {"message": "Redis lock released successfully"}

    # Try to acquire the lock (non-blocking)
    if redis_client.get(TRANSCRIPTION_NLP_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Video transcription and NLP processing is already running. Please wait until the current task completes."
        )

    # Create a job to track this process
    job_data = JobCreateRequest(
        job_type=JobType.TRANSCRIPTION_NLP,
        title="Video Transcription & NLP Processing",
        description="Processing video transcriptions and extracting restaurant information using NLP",
        redis_lock_key=TRANSCRIPTION_NLP_LOCK,
        started_by="system"
    )
    
    job = await JobService.create_job(db, job_data)

    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(TRANSCRIPTION_NLP_LOCK, 3600, "locked")

    async def run_pipeline():
        start_time = time.time()
        last_heartbeat = start_time
        
        try:
            # Start the job
            await JobService.start_job(db, job.id)
            
            # Initialize progress tracking
            await JobService.update_progress(db, job.id, 0, 0)
            
            async def monitored_pipeline():
                nonlocal last_heartbeat
                
                async with AsyncSessionLocal() as session:
                    # Check for cancellation before starting
                    current_job = await JobService.get_job(db, job.id)
                    if current_job and current_job.cancellation_requested:
                        await JobService.cancel_job(db, job.id, "Job cancelled by user request")
                        redis_client.delete(TRANSCRIPTION_NLP_LOCK)
                        return {"cancelled": True}
                    
                    # Heartbeat update
                    await JobService.update_heartbeat(db, job.id)
                    
                    # Run pipeline with job tracking
                    result = await transcription_nlp_pipeline(session, job.id)
                    return result
            
            result = await monitored_pipeline()
            
            if result and result.get("cancelled"):
                return
            
            # Complete the job
            elapsed_time = time.time() - start_time
            result_data = json.dumps({
                "message": "Video transcription and NLP processing completed successfully",
                "elapsed_time": elapsed_time,
                "videos_processed": result.get("videos_processed", 0) if result else 0
            })
            await JobService.complete_job(db, job.id, result_data)
            
        except Exception as e:
            # Check if it's a cancellation
            if "cancelled" in str(e).lower():
                await JobService.cancel_job(db, job.id, str(e))
            else:
                await JobService.fail_job(db, job.id, str(e))
            raise
        finally:
            redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock when done

    task = asyncio.create_task(run_pipeline())
    return {
        "message": "Video transcription and NLP processing started in the background", 
        "task_id": id(task),
        "job_id": str(job.id)
    }

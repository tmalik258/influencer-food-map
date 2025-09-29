import redis
import asyncio
import json
import time
from typing import Optional, List

from fastapi import (APIRouter, Depends, BackgroundTasks, HTTPException, status)
from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import (REDIS_URL, SCRAPE_YOUTUBE_LOCK, TRANSCRIPTION_NLP_LOCK, INFLUENCER_CHANNELS)
from app.database import (AsyncSessionLocal, get_db, get_async_db)
from app.services import (scrape_youtube, transcription_nlp_pipeline, JobService)
from app.models.job import JobType, LockType
from app.dependencies import get_current_admin
from app.api_schema.jobs import JobCreateRequest

router = APIRouter()

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

class ScrapeRequest(BaseModel):
    video_ids: Optional[List[str]] = None
    trigger_type: Optional[LockType] = LockType.AUTOMATIC

@router.post("/scrape-youtube/")
async def trigger_scrape(background_tasks: BackgroundTasks = None, db: Session = Depends(get_db), admin_user = Depends(get_current_admin)):
    """Trigger YouTube scraping in the background with Redis lock and job tracking."""
    # Try to acquire the lock (non-blocking)
    if redis_client.get(SCRAPE_YOUTUBE_LOCK):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="YouTube scraping is already running. Please wait until the current task completes."
        )
    
    # Create a job to track this process
    job_description = "Scraping videos from YouTube channels"

    job_data = JobCreateRequest(
        job_type=JobType.SCRAPE_YOUTUBE,
        title="YouTube Video Scraping",
        description=job_description,
        redis_lock_key=SCRAPE_YOUTUBE_LOCK,
        started_by="system",
        trigger_type=LockType.AUTOMATIC
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
            JobService.update_queue_metrics_sync(db, job.id, len(INFLUENCER_CHANNELS), 0)
            
            # Run the scraping with monitoring
            async def monitored_scrape():
                nonlocal last_heartbeat
                
                # Check for cancellation
                current_job = JobService.get_job_sync(db, job.id)
                if current_job and current_job.cancellation_requested:
                    JobService.cancel_job_sync(db, job.id, "Job cancelled by user request")
                    redis_client.delete(SCRAPE_YOUTUBE_LOCK)
                    return {"cancelled": True}
                
                # Heartbeat update
                JobService.update_heartbeat_sync(db, job.id)
                
                # Run the actual pipeline with video_ids
                return scrape_youtube(db, job.id)
            
            result = await monitored_scrape()
            
            if result and result.get("cancelled"):
                return
            
            # Complete the job
            elapsed_time = time.time() - start_time
            result_data = json.dumps({
                "message": "YouTube scraping completed successfully",
                "elapsed_time": elapsed_time,
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
            "job_id": str(job.id),
            "influencer_count": len(INFLUENCER_CHANNELS)
        }
    except Exception as e:
        redis_client.delete(SCRAPE_YOUTUBE_LOCK)  # Release lock on error
        JobService.fail_job_sync(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraping: {str(e)}"
        )

@router.post("/transcription-nlp/")
async def trigger_transcription_nlp(
    request: ScrapeRequest = ScrapeRequest(),
    release_lock: bool = False,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
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
    job_description = (
        f"Processing {len(request.video_ids)} specific videos for transcription and NLP"
        if request.video_ids
        else "Processing video transcriptions and extracting restaurant information using NLP"
    )
    
    job_data = JobCreateRequest(
        job_type=JobType.TRANSCRIPTION_NLP,
        title="Video Transcription & NLP Processing",
        description=job_description,
        redis_lock_key=TRANSCRIPTION_NLP_LOCK,
        started_by="system",
        trigger_type=request.trigger_type
    )
    
    # Create job and get the ID - use the session only for this
    job = await JobService.create_job(db, job_data)
    job_id = job.id  # Store the job ID

    # Set the lock with a 1-hour TTL (adjust as needed)
    redis_client.setex(TRANSCRIPTION_NLP_LOCK, 3600, "locked")

    async def run_pipeline():
        start_time = time.time()
        last_heartbeat = start_time
        
        # Create a new session for the background task
        async with AsyncSessionLocal() as task_session:
            try:
                # Start the job
                await JobService.start_job(task_session, job_id)
                
                # Initialize progress tracking
                await JobService.update_progress(task_session, job_id, 0, 0)
                
                async def monitored_pipeline():
                    nonlocal last_heartbeat
                    
                    # Use the task_session for all operations
                    # Check for cancellation before starting
                    current_job = await JobService.get_job(task_session, job_id)
                    if current_job and current_job.cancellation_requested:
                        await JobService.cancel_job(task_session, job_id, "Job cancelled by user request")
                        redis_client.delete(TRANSCRIPTION_NLP_LOCK)
                        return {"cancelled": True}
                    
                    # Heartbeat update
                    await JobService.update_heartbeat(task_session, job_id)
                    
                    # Run pipeline with job tracking and video_ids
                    result = await transcription_nlp_pipeline(task_session, video_ids=request.video_ids or [], job_id=job_id)
                    return result
                
                result = await monitored_pipeline()
                
                if result and result.get("cancelled"):
                    return
                
                if result and result.get("failed_videos") == result.get("total_videos"):
                    raise Exception(f"Transcription and NLP pipeline completed with {result.get('failed_videos')} failures.")
                
                # Complete the job
                elapsed_time = time.time() - start_time
                result_data = json.dumps({
                    "message": "Video transcription and NLP processing completed successfully",
                    "elapsed_time": elapsed_time,
                    "videos_processed": result.get("videos_processed", 0) if result else 0
                })
                await JobService.complete_job(task_session, job_id, result_data)
                
            except Exception as e:
                # Check if it's a cancellation
                if "cancelled" in str(e).lower():
                    await JobService.cancel_job(task_session, job_id, str(e))
                else:
                    await JobService.fail_job(task_session, job_id, str(e))
                raise
            finally:
                redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Release lock when done

    task = asyncio.create_task(run_pipeline())
    
    response_message = (
        f"Video transcription and NLP processing started for {len(request.video_ids)} specific videos"
        if request.video_ids
        else "Video transcription and NLP processing started in the background"
    )
    
    return {
        "message": response_message, 
        "task_id": id(task),
        "job_id": str(job_id),
        "video_count": len(request.video_ids) if request.video_ids else None
    }

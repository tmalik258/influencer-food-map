from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db, get_db
from app.models.job import JobStatus, JobType, LockType
from app.dependencies import get_current_admin
from app.utils.logging import setup_logger
from app.services.jobs import JobService
from app.api_schema.jobs import (
    JobResponse,
    CancelJobRequest,
)

router = APIRouter()

logger = setup_logger(__name__)

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[JobStatus] = Query(None),
    job_type: Optional[JobType] = Query(None),
    trigger_type: Optional[LockType] = Query(None, description="Filter by lock type"),
    cancellation_requested: Optional[bool] = Query(None, description="Filter by cancellation status"),
    has_failed_items: Optional[bool] = Query(None, description="Filter jobs with failed items"),
    min_progress: Optional[int] = Query(None, ge=0, le=100, description="Minimum progress percentage"),
    max_progress: Optional[int] = Query(None, ge=0, le=100, description="Maximum progress percentage"),
    # Date range filters
    created_after: Optional[datetime] = Query(None, description="Filter jobs created after this date"),
    created_before: Optional[datetime] = Query(None, description="Filter jobs created before this date"),
    started_after: Optional[datetime] = Query(None, description="Filter jobs started after this date"),
    started_before: Optional[datetime] = Query(None, description="Filter jobs started before this date"),
    completed_after: Optional[datetime] = Query(None, description="Filter jobs completed after this date"),
    completed_before: Optional[datetime] = Query(None, description="Filter jobs completed before this date"),
    # Processing status filters
    is_stale: Optional[bool] = Query(None, description="Filter stale jobs (no heartbeat in 30+ minutes)"),
    is_active: Optional[bool] = Query(None, description="Filter active jobs (running/pending)"),
    # Sorting
    sort_by: Optional[str] = Query("created_at", description="Sort by field: created_at, started_at, completed_at, progress, processing_rate"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get all jobs with enhanced filtering and sorting capabilities."""
    try:
        jobs = await JobService.get_jobs(
            db=db,
            skip=skip,
            limit=limit,
            status=status,
            job_type=job_type
        )
        
        # Apply additional filters
        if trigger_type is not None:
            jobs = [job for job in jobs if job.trigger_type == trigger_type]
        
        if cancellation_requested is not None:
            jobs = [job for job in jobs if job.cancellation_requested == cancellation_requested]
        
        if has_failed_items is not None:
            if has_failed_items:
                jobs = [job for job in jobs if job.failed_items and job.failed_items > 0]
            else:
                jobs = [job for job in jobs if not job.failed_items or job.failed_items == 0]
        
        if min_progress is not None:
            jobs = [job for job in jobs if job.progress >= min_progress]
        
        if max_progress is not None:
            jobs = [job for job in jobs if job.progress <= max_progress]
        
        # Date range filters
        if created_after:
            jobs = [job for job in jobs if job.created_at >= created_after]
        if created_before:
            jobs = [job for job in jobs if job.created_at <= created_before]
        if started_after:
            jobs = [job for job in jobs if job.started_at and job.started_at >= started_after]
        if started_before:
            jobs = [job for job in jobs if job.started_at and job.started_at <= started_before]
        if completed_after:
            jobs = [job for job in jobs if job.completed_at and job.completed_at >= completed_after]
        if completed_before:
            jobs = [job for job in jobs if job.completed_at and job.completed_at <= completed_before]
        
        # Processing status filters
        if is_stale is not None:
            stale_threshold = datetime.utcnow() - timedelta(minutes=30)
            if is_stale:
                jobs = [job for job in jobs if job.status == JobStatus.RUNNING and 
                    job.last_heartbeat and job.last_heartbeat < stale_threshold]
            else:
                jobs = [job for job in jobs if not (job.status == JobStatus.RUNNING and 
                    job.last_heartbeat and job.last_heartbeat < stale_threshold)]
        
        if is_active is not None:
            active_statuses = [JobStatus.RUNNING, JobStatus.PENDING]
            if is_active:
                jobs = [job for job in jobs if job.status in active_statuses]
            else:
                jobs = [job for job in jobs if job.status not in active_statuses]
        
        # Sorting
        reverse_order = sort_order.lower() == "desc"
        if sort_by == "created_at":
            jobs.sort(key=lambda x: x.created_at or datetime.min, reverse=reverse_order)
        elif sort_by == "started_at":
            jobs.sort(key=lambda x: x.started_at or datetime.min, reverse=reverse_order)
        elif sort_by == "completed_at":
            jobs.sort(key=lambda x: x.completed_at or datetime.min, reverse=reverse_order)
        elif sort_by == "progress":
            jobs.sort(key=lambda x: x.progress or 0, reverse=reverse_order)
        elif sort_by == "processing_rate":
            jobs.sort(key=lambda x: x.processing_rate or 0, reverse=reverse_order)
        
        return jobs
    except Exception as e:
        logger.error(f"Unexpected error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching jobs")

@router.get("/{job_id}/", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get a specific job by ID."""
    try:
        job = await JobService.get_job(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error fetching job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching job")

@router.post("/{job_id}/start/", response_model=JobResponse)
async def start_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Start a job."""
    try:
        job = await JobService.start_job(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error starting job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while starting job")

@router.post("/{job_id}/complete/", response_model=JobResponse)
async def complete_job(
    job_id: UUID,
    result_data: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Mark a job as completed."""
    try:
        job = await JobService.complete_job(db, job_id, result_data)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error completing job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while completing job")

@router.post("/{job_id}/fail/", response_model=JobResponse)
async def fail_job(
    job_id: UUID,
    error_message: str,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Mark a job as failed."""
    try:
        job = await JobService.fail_job(db, job_id, error_message)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error failing job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while failing job")

@router.put("/{job_id}/progress/", response_model=JobResponse)
async def update_job_progress(
    job_id: UUID,
    progress: int = Query(..., ge=0, le=100),
    processed_items: Optional[int] = Query(None, ge=0),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Update job progress."""
    try:
        job = await JobService.update_progress(db, job_id, progress, processed_items)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error updating progress for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while updating job progress")

@router.post("/{job_id}/cancel/", response_model=JobResponse)
async def cancel_job(
    job_id: UUID,
    cancel_request: CancelJobRequest = Body(...),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Cancel a job."""
    try:
        job = await JobService.cancel_job(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error canceling job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while canceling job")

@router.post("/{job_id}/request-cancellation/", response_model=JobResponse)
async def request_job_cancellation(
    job_id: UUID,
    cancel_request: CancelJobRequest = Body(...),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Request job cancellation without immediately stopping it."""
    try:
        job = await JobService.request_cancellation(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        logger.error(f"Unexpected error requesting cancellation for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while requesting job cancellation")

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.job import JobStatus, JobType
from app.database import get_async_db, get_db
from app.dependencies import get_current_admin
from app.services.jobs import JobService
from app.api_schema.jobs import (
    JobResponse,
    JobListResponse,
    JobCreateRequest,
    JobUpdateRequest,
    CancelJobRequest,
    TrackingStatsRequest,
    JobAnalyticsResponse,
    ActiveJobsResponse,
    CleanupStaleJobsResponse
)

router = APIRouter()

@router.get("/", response_model=List[JobListResponse])
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[JobStatus] = Query(None),
    job_type: Optional[JobType] = Query(None),
    started_by: Optional[str] = Query(None, description="Filter by user who started the job"),
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
    jobs = await JobService.get_jobs(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        job_type=job_type
    )
    
    # Apply additional filters
    if started_by:
        jobs = [job for job in jobs if job.started_by and started_by.lower() in job.started_by.lower()]
    
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

@router.get("/{job_id}/", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get a specific job by ID."""
    job = await JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreateRequest,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Create a new job."""
    # Set the started_by field to the current admin's email
    job_data.started_by = admin_user.get('email', 'admin')
    
    job = await JobService.create_job(db, job_data)
    return job

@router.put("/{job_id}/", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    job_data: JobUpdateRequest,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Update a job."""
    job = await JobService.update_job(db, job_id, job_data)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/start/", response_model=JobResponse)
async def start_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Start a job."""
    job = await JobService.start_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/complete/", response_model=JobResponse)
async def complete_job(
    job_id: UUID,
    result_data: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Mark a job as completed."""
    job = await JobService.complete_job(db, job_id, result_data)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/fail/", response_model=JobResponse)
async def fail_job(
    job_id: UUID,
    error_message: str,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Mark a job as failed."""
    job = await JobService.fail_job(db, job_id, error_message)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}/progress/", response_model=JobResponse)
async def update_job_progress(
    job_id: UUID,
    progress: int = Query(..., ge=0, le=100),
    processed_items: Optional[int] = Query(None, ge=0),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Update job progress."""
    job = await JobService.update_progress(db, job_id, progress, processed_items)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/cancel/", response_model=JobResponse)
async def cancel_job(
    job_id: UUID,
    cancel_request: CancelJobRequest = Body(...),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Cancel a job."""
    cancelled_by = admin_user.get('email', 'admin')
    job = await JobService.cancel_job(db, job_id, cancelled_by)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/request-cancellation/", response_model=JobResponse)
async def request_job_cancellation(
    job_id: UUID,
    cancel_request: CancelJobRequest = Body(...),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Request job cancellation without immediately stopping it."""
    cancelled_by = admin_user.get('email', 'admin')
    job = await JobService.request_cancellation(db, job_id, cancelled_by)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}/tracking-stats/", response_model=JobResponse)
async def update_tracking_stats(
    job_id: UUID,
    stats: TrackingStatsRequest,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Update job tracking statistics."""
    job = await JobService.update_tracking_stats(
        db=db,
        job_id=job_id,
        queue_size=stats.queue_size,
        items_in_progress=stats.items_in_progress,
        failed_items=stats.failed_items,
        processing_rate=stats.processing_rate,
        estimated_completion_time=stats.estimated_completion_time
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/heartbeat/", response_model=JobResponse)
async def update_heartbeat(
    job_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Update job heartbeat timestamp."""
    job = await JobService.update_heartbeat(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/analytics/", response_model=JobAnalyticsResponse)
async def get_job_analytics(
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get comprehensive job analytics including completion rates, processing times, and success ratios."""
    try:
        # Get all jobs from the specified period
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        all_jobs = await JobService.get_jobs(db, limit=10000)
        recent_jobs = [job for job in all_jobs if job.created_at >= cutoff_date]
        
        # Completion rates by type
        completion_rates_by_type = {}
        for job_type in JobType:
            type_jobs = [job for job in recent_jobs if job.job_type == job_type]
            completed = len([job for job in type_jobs if job.status == JobStatus.COMPLETED])
            total = len(type_jobs)
            completion_rates_by_type[job_type.value] = {
                "completed": completed,
                "total": total,
                "rate": (completed / total * 100) if total > 0 else 0
            }
        
        # Average processing times
        average_processing_times = {}
        for job_type in JobType:
            type_jobs = [job for job in recent_jobs if job.job_type == job_type and job.started_at and job.completed_at]
            if type_jobs:
                durations = [(job.completed_at - job.started_at).total_seconds() / 60 for job in type_jobs]
                average_processing_times[job_type.value] = {
                    "average_minutes": sum(durations) / len(durations),
                    "min_minutes": min(durations),
                    "max_minutes": max(durations),
                    "sample_size": len(durations)
                }
            else:
                average_processing_times[job_type.value] = {
                    "average_minutes": 0,
                    "min_minutes": 0,
                    "max_minutes": 0,
                    "sample_size": 0
                }
        
        # Success/failure ratios
        success_failure_ratios = {}
        for job_type in JobType:
            type_jobs = [job for job in recent_jobs if job.job_type == job_type]
            completed = len([job for job in type_jobs if job.status == JobStatus.COMPLETED])
            failed = len([job for job in type_jobs if job.status == JobStatus.FAILED])
            cancelled = len([job for job in type_jobs if job.status == JobStatus.CANCELLED])
            total_finished = completed + failed + cancelled
            
            success_failure_ratios[job_type.value] = {
                "success_count": completed,
                "failure_count": failed,
                "cancelled_count": cancelled,
                "success_rate": (completed / total_finished * 100) if total_finished > 0 else 0,
                "failure_rate": (failed / total_finished * 100) if total_finished > 0 else 0
            }
        
        # Processing rate statistics
        processing_rates = [job.processing_rate for job in recent_jobs if job.processing_rate and job.processing_rate > 0]
        processing_rate_statistics = {
            "average_rate": sum(processing_rates) / len(processing_rates) if processing_rates else 0,
            "min_rate": min(processing_rates) if processing_rates else 0,
            "max_rate": max(processing_rates) if processing_rates else 0,
            "sample_size": len(processing_rates)
        }
        
        # Queue metrics
        active_jobs = [job for job in recent_jobs if job.status in [JobStatus.RUNNING, JobStatus.PENDING]]
        queue_metrics = {
            "total_queue_size": sum([job.queue_size or 0 for job in active_jobs]),
            "total_items_in_progress": sum([job.items_in_progress or 0 for job in active_jobs]),
            "total_failed_items": sum([job.failed_items or 0 for job in recent_jobs]),
            "active_jobs_count": len(active_jobs)
        }
    
        return JobAnalyticsResponse(
            completion_rates_by_type=completion_rates_by_type,
            average_processing_times=average_processing_times,
            success_failure_ratios=success_failure_ratios,
            processing_rate_statistics=processing_rate_statistics,
            queue_metrics=queue_metrics,
            total_jobs=len(recent_jobs),
            period_analyzed=f"{days} days"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve job analytics: {str(e)}")

@router.get("/active/", response_model=ActiveJobsResponse)
async def get_active_jobs(
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get currently running jobs with real-time metrics."""
    try:
        # Get all active jobs (running and pending)
        running_jobs = await JobService.get_jobs(db, status=JobStatus.RUNNING, limit=1000)
        pending_jobs = await JobService.get_jobs(db, status=JobStatus.PENDING, limit=1000)
        active_jobs = running_jobs + pending_jobs
        
        # Calculate metrics
        jobs_with_cancellation = len([job for job in active_jobs if job.cancellation_requested])
        total_progress = sum([job.progress or 0 for job in active_jobs])
        average_progress = (total_progress / len(active_jobs)) if active_jobs else 0
        total_queue_size = sum([job.queue_size or 0 for job in active_jobs])
        total_items_in_progress = sum([job.items_in_progress or 0 for job in active_jobs])
        
        return ActiveJobsResponse(
            active_jobs=active_jobs,
            total_active=len(active_jobs),
            jobs_with_cancellation_requests=jobs_with_cancellation,
            average_progress=round(average_progress, 2),
            total_queue_size=total_queue_size,
            total_items_in_progress=total_items_in_progress
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve active jobs: {str(e)}")

@router.post("/cleanup-stale/", response_model=CleanupStaleJobsResponse)
async def cleanup_stale_jobs(
    threshold_minutes: int = Query(30, ge=5, le=1440, description="Minutes without heartbeat to consider job stale"),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Clean up jobs that haven't sent heartbeat within the threshold."""
    try:
        cleaned_jobs = await JobService.cleanup_stale_jobs(db, threshold_minutes)
        
        return CleanupStaleJobsResponse(
            cleaned_jobs=cleaned_jobs,
            total_cleaned=len(cleaned_jobs),
            threshold_minutes=threshold_minutes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup stale jobs: {str(e)}")

@router.get("/status/summary/")
async def get_jobs_summary(
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get an enhanced summary of job statuses and statistics."""
    # Get counts for each status
    summary = {}
    total_failed_items = 0
    total_processed_items = 0
    total_queue_size = 0
    active_jobs_with_cancellation = 0
    
    for status in JobStatus:
        jobs = await JobService.get_jobs(db, status=status, limit=1000)
        summary[status.value] = len(jobs)
        
        # Aggregate statistics
        for job in jobs:
            if job.failed_items:
                total_failed_items += job.failed_items
            if job.processed_items:
                total_processed_items += job.processed_items
            if job.queue_size:
                total_queue_size += job.queue_size
            if job.status in [JobStatus.RUNNING, JobStatus.PENDING] and job.cancellation_requested:
                active_jobs_with_cancellation += 1
    
    # Get running jobs with enhanced data
    running_jobs = await JobService.get_jobs(db, status=JobStatus.RUNNING, limit=10)
    
    # Get jobs with cancellation requests
    all_jobs = await JobService.get_jobs(db, limit=1000)
    cancellation_requested_jobs = [job for job in all_jobs if job.cancellation_requested]
    
    return {
        "status_counts": summary,
        "running_jobs": running_jobs,
        "total_jobs": sum(summary.values()),
        "statistics": {
            "total_failed_items": total_failed_items,
            "total_processed_items": total_processed_items,
            "total_queue_size": total_queue_size,
            "active_jobs_with_cancellation": active_jobs_with_cancellation,
            "total_cancellation_requests": len(cancellation_requested_jobs)
        },
        "cancellation_requested_jobs": cancellation_requested_jobs[:5]  # Show first 5
    }

@router.get("/analytics/performance/")
async def get_performance_analytics(
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get job performance analytics."""
    all_jobs = await JobService.get_jobs(db, limit=1000)
    
    # Filter jobs from the last N days
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    recent_jobs = [job for job in all_jobs if job.created_at >= cutoff_date]
    
    # Calculate analytics
    completed_jobs = [job for job in recent_jobs if job.status == JobStatus.COMPLETED]
    failed_jobs = [job for job in recent_jobs if job.status == JobStatus.FAILED]
    cancelled_jobs = [job for job in recent_jobs if job.status == JobStatus.CANCELLED]
    
    # Calculate average processing rates
    avg_processing_rate = 0
    if completed_jobs:
        rates = [job.processing_rate for job in completed_jobs if job.processing_rate]
        if rates:
            avg_processing_rate = sum(rates) / len(rates)
    
    # Calculate success rate
    total_finished = len(completed_jobs) + len(failed_jobs) + len(cancelled_jobs)
    success_rate = (len(completed_jobs) / total_finished * 100) if total_finished > 0 else 0
    
    return {
        "period_days": days,
        "total_jobs": len(recent_jobs),
        "completed_jobs": len(completed_jobs),
        "failed_jobs": len(failed_jobs),
        "cancelled_jobs": len(cancelled_jobs),
        "success_rate": round(success_rate, 2),
        "average_processing_rate": round(avg_processing_rate, 2),
        "job_types_breakdown": {
            job_type.value: len([job for job in recent_jobs if job.job_type == job_type])
            for job_type in JobType
        }
    }

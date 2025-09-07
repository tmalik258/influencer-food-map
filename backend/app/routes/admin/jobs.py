from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
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
    JobUpdateRequest
)

router = APIRouter()

@router.get("/", response_model=List[JobListResponse])
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[JobStatus] = Query(None),
    job_type: Optional[JobType] = Query(None),
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get all jobs with optional filtering."""
    jobs = await JobService.get_jobs(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        job_type=job_type
    )
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
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

@router.put("/{job_id}", response_model=JobResponse)
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

@router.post("/{job_id}/start", response_model=JobResponse)
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

@router.post("/{job_id}/complete", response_model=JobResponse)
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

@router.post("/{job_id}/fail", response_model=JobResponse)
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

@router.put("/{job_id}/progress", response_model=JobResponse)
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

@router.get("/status/summary")
async def get_jobs_summary(
    db: AsyncSession = Depends(get_async_db),
    admin_user = Depends(get_current_admin)
):
    """Get a summary of job statuses."""
    # Get counts for each status
    summary = {}
    for status in JobStatus:
        jobs = await JobService.get_jobs(db, status=status, limit=1000)
        summary[status.value] = len(jobs)
    
    # Get running jobs
    running_jobs = await JobService.get_jobs(db, status=JobStatus.RUNNING, limit=10)
    
    return {
        "status_counts": summary,
        "running_jobs": running_jobs,
        "total_jobs": sum(summary.values())
    }
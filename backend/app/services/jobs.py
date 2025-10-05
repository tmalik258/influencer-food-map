from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, update, desc

from app.models.job import Job, JobStatus, JobType
from app.api_schema.jobs import JobCreateRequest, JobUpdateRequest

class JobService:
    @staticmethod
    async def create_job(db: AsyncSession, job_data: JobCreateRequest) -> Job:
        """Create a new job."""
        job = Job(
            job_type=job_data.job_type,
            title=job_data.title,
            description=job_data.description,
            total_items=job_data.total_items,
            redis_lock_key=job_data.redis_lock_key,
            trigger_type=job_data.trigger_type,
            status=JobStatus.PENDING
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    def create_job_sync(db: Session, job_data: JobCreateRequest) -> Job:
        """Create a new job (synchronous version)."""
        job = Job(
            job_type=job_data.job_type,
            title=job_data.title,
            description=job_data.description,
            total_items=job_data.total_items,
            redis_lock_key=job_data.redis_lock_key,
            trigger_type=job_data.trigger_type,
            status=JobStatus.PENDING
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    async def get_job(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Get a job by ID."""
        result = await db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    def get_job_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Get a job by ID (synchronous version)."""
        return db.query(Job).filter(Job.id == job_id).first()

    @staticmethod
    async def get_jobs(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[JobStatus] = None,
        job_type: Optional[JobType] = None
    ) -> List[Job]:
        """Get jobs with optional filtering."""
        query = select(Job).order_by(desc(Job.created_at))
        
        if status:
            query = query.where(Job.status == status)
        if job_type:
            query = query.where(Job.job_type == job_type)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    def get_jobs_sync(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[JobStatus] = None,
        job_type: Optional[JobType] = None
    ) -> List[Job]:
        """Get jobs with optional filtering (synchronous version)."""
        query = db.query(Job).order_by(desc(Job.created_at))
        
        if status:
            query = query.filter(Job.status == status)
        if job_type:
            query = query.filter(Job.job_type == job_type)
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    async def update_job(db: AsyncSession, job_id: UUID, job_data: JobUpdateRequest) -> Optional[Job]:
        """Update a job."""
        update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
        
        if update_data:
            await db.execute(
                update(Job).where(Job.id == job_id).values(**update_data)
            )
            await db.commit()
            
        return await JobService.get_job(db, job_id)

    @staticmethod
    def update_job_sync(db: Session, job_id: UUID, job_data: JobUpdateRequest) -> Optional[Job]:
        """Update a job (synchronous version)."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return None
            
        update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
        
        for key, value in update_data.items():
            setattr(job, key, value)
            
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    async def start_job(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Mark a job as started."""
        update_data = JobUpdateRequest(
            status=JobStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def start_job_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Mark a job as started (synchronous version)."""
        update_data = JobUpdateRequest(
            status=JobStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def complete_job(db: AsyncSession, job_id: UUID, result_data: Optional[str] = None) -> Optional[Job]:
        """Mark a job as completed."""
        update_data = JobUpdateRequest(
            status=JobStatus.COMPLETED,
            progress=100,
            completed_at=datetime.utcnow(),
            result_data=result_data
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def complete_job_sync(db: Session, job_id: UUID, result_data: Optional[str] = None) -> Optional[Job]:
        """Mark a job as completed (synchronous version)."""
        update_data = JobUpdateRequest(
            status=JobStatus.COMPLETED,
            progress=100,
            completed_at=datetime.utcnow(),
            result_data=result_data
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def fail_job(db: AsyncSession, job_id: UUID, error_message: str) -> Optional[Job]:
        """Mark a job as failed."""
        update_data = JobUpdateRequest(
            status=JobStatus.FAILED,
            completed_at=datetime.utcnow(),
            error_message=error_message
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def fail_job_sync(db: Session, job_id: UUID, error_message: str) -> Optional[Job]:
        """Mark a job as failed (synchronous version)."""
        update_data = JobUpdateRequest(
            status=JobStatus.FAILED,
            completed_at=datetime.utcnow(),
            error_message=error_message
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def update_progress(db: AsyncSession, job_id: UUID, progress: int, processed_items: Optional[int] = None) -> Optional[Job]:
        """Update job progress."""
        update_data = JobUpdateRequest(
            progress=min(100, max(0, progress)),
            processed_items=processed_items
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def update_progress_sync(db: Session, job_id: UUID, progress: int, processed_items: Optional[int] = None) -> Optional[Job]:
        """Update job progress (synchronous version)."""
        update_data = JobUpdateRequest(
            progress=min(100, max(0, progress)),
            processed_items=processed_items
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def cancel_job(db: AsyncSession, job_id: UUID, error_message: Optional[str] = None) -> Optional[Job]:
        """Cancel a job."""
        update_data = JobUpdateRequest(
            status=JobStatus.CANCELLED,
            cancellation_requested=True,
            cancelled_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            error_message=error_message
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def cancel_job_sync(db: Session, job_id: UUID, error_message: Optional[str] = None) -> Optional[Job]:
        """Cancel a job (synchronous version)."""
        update_data = JobUpdateRequest(
            status=JobStatus.CANCELLED,
            cancellation_requested=True,
            cancelled_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            error_message=error_message
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def request_cancellation(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Request job cancellation without immediately stopping it."""
        update_data = JobUpdateRequest(
            cancellation_requested=True,
            cancelled_at=datetime.utcnow()
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def request_cancellation_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Request job cancellation without immediately stopping it (synchronous version)."""
        update_data = JobUpdateRequest(
            cancellation_requested=True,
            cancelled_at=datetime.utcnow()
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def update_heartbeat(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Update job heartbeat timestamp."""
        update_data = JobUpdateRequest(
            last_heartbeat=datetime.utcnow()
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def update_heartbeat_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Update job heartbeat timestamp (synchronous version)."""
        update_data = JobUpdateRequest(
            last_heartbeat=datetime.utcnow()
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def update_tracking_stats(db: AsyncSession, job_id: UUID, 
                                  queue_size: Optional[int] = None,
                                  items_in_progress: Optional[int] = None,
                                  failed_items: Optional[int] = None,
                                  processing_rate: Optional[float] = None,
                                  estimated_completion_time: Optional[datetime] = None) -> Optional[Job]:
        """Update job tracking statistics."""
        update_data = JobUpdateRequest(
            queue_size=queue_size,
            items_in_progress=items_in_progress,
            failed_items=failed_items,
            processing_rate=processing_rate,
            estimated_completion_time=estimated_completion_time,
            last_heartbeat=datetime.utcnow()
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def update_tracking_stats_sync(db: Session, job_id: UUID, 
                                 queue_size: Optional[int] = None,
                                 items_in_progress: Optional[int] = None,
                                 failed_items: Optional[int] = None,
                                 processing_rate: Optional[float] = None,
                                 estimated_completion_time: Optional[datetime] = None) -> Optional[Job]:
        """Update job tracking statistics (synchronous version)."""
        update_data = JobUpdateRequest(
            queue_size=queue_size,
            items_in_progress=items_in_progress,
            failed_items=failed_items,
            processing_rate=processing_rate,
            estimated_completion_time=estimated_completion_time,
            last_heartbeat=datetime.utcnow()
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def increment_retry(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Increment job retry count."""
        job = await JobService.get_job(db, job_id)
        if job:
            new_retry_count = (job.retry_count or 0) + 1
            update_data = JobUpdateRequest(
                retry_count=new_retry_count,
                last_heartbeat=datetime.utcnow()
            )
            return await JobService.update_job(db, job_id, update_data)
        return None

    @staticmethod
    def increment_retry_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Increment job retry count (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        if job:
            new_retry_count = (job.retry_count or 0) + 1
            update_data = JobUpdateRequest(
                retry_count=new_retry_count,
                last_heartbeat=datetime.utcnow()
            )
            return JobService.update_job_sync(db, job_id, update_data)
        return None

    @staticmethod
    async def check_cancellation_requested(db: AsyncSession, job_id: UUID) -> bool:
        """Check if cancellation has been requested for a job."""
        job = await JobService.get_job(db, job_id)
        return job.cancellation_requested if job else False

    @staticmethod
    def check_cancellation_requested_sync(db: Session, job_id: UUID) -> bool:
        """Check if cancellation has been requested for a job (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        return job.cancellation_requested if job else False

    @staticmethod
    async def update_queue_metrics(db: AsyncSession, job_id: UUID, queue_size: int, items_in_progress: int) -> Optional[Job]:
        """Update queue size and items in progress."""
        update_data = JobUpdateRequest(
            queue_size=queue_size,
            items_in_progress=items_in_progress,
            last_heartbeat=datetime.utcnow()
        )
        return await JobService.update_job(db, job_id, update_data)

    @staticmethod
    def update_queue_metrics_sync(db: Session, job_id: UUID, queue_size: int, items_in_progress: int) -> Optional[Job]:
        """Update queue size and items in progress (synchronous version)."""
        update_data = JobUpdateRequest(
            queue_size=queue_size,
            items_in_progress=items_in_progress,
            last_heartbeat=datetime.utcnow()
        )
        return JobService.update_job_sync(db, job_id, update_data)

    @staticmethod
    async def increment_failed_items(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Increment the count of failed items."""
        job = await JobService.get_job(db, job_id)
        if job:
            new_failed_count = (job.failed_items or 0) + 1
            update_data = JobUpdateRequest(
                failed_items=new_failed_count,
                last_heartbeat=datetime.utcnow()
            )
            return await JobService.update_job(db, job_id, update_data)
        return None

    @staticmethod
    def increment_failed_items_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Increment the count of failed items (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        if job:
            new_failed_count = (job.failed_items or 0) + 1
            update_data = JobUpdateRequest(
                failed_items=new_failed_count,
                last_heartbeat=datetime.utcnow()
            )
            return JobService.update_job_sync(db, job_id, update_data)
        return None

    @staticmethod
    async def calculate_processing_rate(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Calculate and update processing rate based on processed items and time elapsed."""
        job = await JobService.get_job(db, job_id)
        if job and job.started_at and job.processed_items:
            time_elapsed = (datetime.utcnow() - job.started_at).total_seconds() / 60  # minutes
            if time_elapsed > 0:
                processing_rate = job.processed_items / time_elapsed  # items per minute
                update_data = JobUpdateRequest(
                    processing_rate=processing_rate,
                    last_heartbeat=datetime.utcnow()
                )
                return await JobService.update_job(db, job_id, update_data)
        return job

    @staticmethod
    def calculate_processing_rate_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Calculate and update processing rate based on processed items and time elapsed (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        if job and job.started_at and job.processed_items:
            time_elapsed = (datetime.utcnow() - job.started_at).total_seconds() / 60  # minutes
            if time_elapsed > 0:
                processing_rate = job.processed_items / time_elapsed  # items per minute
                update_data = JobUpdateRequest(
                    processing_rate=processing_rate,
                    last_heartbeat=datetime.utcnow()
                )
                return JobService.update_job_sync(db, job_id, update_data)
        return job

    @staticmethod
    async def get_job_analytics(db: AsyncSession, job_id: UUID) -> Optional[dict]:
        """Get comprehensive job statistics and analytics."""
        job = await JobService.get_job(db, job_id)
        if not job:
            return None
            
        analytics = {
            "job_id": str(job.id),
            "status": job.status,
            "progress_percentage": job.progress,
            "total_items": job.total_items,
            "processed_items": job.processed_items,
            "failed_items": job.failed_items or 0,
            "queue_size": job.queue_size or 0,
            "items_in_progress": job.items_in_progress or 0,
            "retry_count": job.retry_count or 0,
            "max_retries": job.max_retries or 3,
            "processing_rate": job.processing_rate,
            "estimated_completion_time": job.estimated_completion_time,
            "cancellation_requested": job.cancellation_requested,
            "cancelled_at": job.cancelled_at,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "last_heartbeat": job.last_heartbeat,
            "duration_minutes": None,
            "success_rate": None
        }
        
        # Calculate duration if job has started
        if job.started_at:
            end_time = job.completed_at or datetime.utcnow()
            duration = (end_time - job.started_at).total_seconds() / 60
            analytics["duration_minutes"] = round(duration, 2)
            
        # Calculate success rate
        if job.processed_items and job.processed_items > 0:
            failed_count = job.failed_items or 0
            success_rate = ((job.processed_items - failed_count) / job.processed_items) * 100
            analytics["success_rate"] = round(success_rate, 2)
            
        return analytics

    @staticmethod
    def get_job_analytics_sync(db: Session, job_id: UUID) -> Optional[dict]:
        """Get comprehensive job statistics and analytics (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        if not job:
            return None
            
        analytics = {
            "job_id": str(job.id),
            "status": job.status,
            "progress_percentage": job.progress,
            "total_items": job.total_items,
            "processed_items": job.processed_items,
            "failed_items": job.failed_items or 0,
            "queue_size": job.queue_size or 0,
            "items_in_progress": job.items_in_progress or 0,
            "retry_count": job.retry_count or 0,
            "max_retries": job.max_retries or 3,
            "processing_rate": job.processing_rate,
            "estimated_completion_time": job.estimated_completion_time,
            "cancellation_requested": job.cancellation_requested,
            "cancelled_at": job.cancelled_at,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "last_heartbeat": job.last_heartbeat,
            "duration_minutes": None,
            "success_rate": None
        }
        
        # Calculate duration if job has started
        if job.started_at:
            end_time = job.completed_at or datetime.utcnow()
            duration = (end_time - job.started_at).total_seconds() / 60
            analytics["duration_minutes"] = round(duration, 2)
            
        # Calculate success rate
        if job.processed_items and job.processed_items > 0:
            failed_count = job.failed_items or 0
            success_rate = ((job.processed_items - failed_count) / job.processed_items) * 100
            analytics["success_rate"] = round(success_rate, 2)
            
        return analytics

    @staticmethod
    async def is_cancellation_requested(db: AsyncSession, job_id: UUID) -> bool:
        """Check if cancellation has been requested for a job."""
        return await JobService.check_cancellation_requested(db, job_id)

    @staticmethod
    def is_cancellation_requested_sync(db: Session, job_id: UUID) -> bool:
        """Check if cancellation has been requested for a job (synchronous version)."""
        return JobService.check_cancellation_requested_sync(db, job_id)

    @staticmethod
    async def cleanup_stale_jobs(db: AsyncSession, stale_threshold_minutes: int = 30) -> List[Job]:
        """Clean up jobs that haven't sent heartbeat within the threshold."""
        threshold_time = datetime.utcnow() - timedelta(minutes=stale_threshold_minutes)
        
        # Find running jobs that haven't sent heartbeat recently
        result = await db.execute(
            select(Job).where(
                Job.status == JobStatus.RUNNING,
                Job.last_heartbeat < threshold_time
            )
        )
        stale_jobs = result.scalars().all()
        
        # Mark stale jobs as failed
        updated_jobs = []
        for job in stale_jobs:
            update_data = JobUpdateRequest(
                status=JobStatus.FAILED,
                error_message=f"Job marked as stale - no heartbeat for {stale_threshold_minutes} minutes",
                completed_at=datetime.utcnow()
            )
            updated_job = await JobService.update_job(db, job.id, update_data)
            if updated_job:
                updated_jobs.append(updated_job)
                
        return updated_jobs

    @staticmethod
    def cleanup_stale_jobs_sync(db: Session, stale_threshold_minutes: int = 30) -> List[Job]:
        """Clean up jobs that haven't sent heartbeat within the threshold (synchronous version)."""
        threshold_time = datetime.utcnow() - timedelta(minutes=stale_threshold_minutes)
        
        # Find running jobs that haven't sent heartbeat recently
        stale_jobs = db.query(Job).filter(
            Job.status == JobStatus.RUNNING,
            Job.last_heartbeat < threshold_time
        ).all()
        
        # Mark stale jobs as failed
        updated_jobs = []
        for job in stale_jobs:
            update_data = JobUpdateRequest(
                status=JobStatus.FAILED,
                error_message=f"Job marked as stale - no heartbeat for {stale_threshold_minutes} minutes",
                completed_at=datetime.utcnow()
            )
            updated_job = JobService.update_job_sync(db, job.id, update_data)
            if updated_job:
                updated_jobs.append(updated_job)
                
        return updated_jobs

    @staticmethod
    async def estimate_completion_time(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        """Calculate and update estimated completion time based on processing rate."""
        job = await JobService.get_job(db, job_id)
        if job and job.processing_rate and job.total_items and job.processed_items is not None:
            remaining_items = job.total_items - job.processed_items
            if remaining_items > 0 and job.processing_rate > 0:
                minutes_remaining = remaining_items / job.processing_rate
                estimated_completion = datetime.utcnow() + timedelta(minutes=minutes_remaining)
                update_data = JobUpdateRequest(
                    estimated_completion_time=estimated_completion,
                    last_heartbeat=datetime.utcnow()
                )
                return await JobService.update_job(db, job_id, update_data)
        return job

    @staticmethod
    def estimate_completion_time_sync(db: Session, job_id: UUID) -> Optional[Job]:
        """Calculate and update estimated completion time based on processing rate (synchronous version)."""
        job = JobService.get_job_sync(db, job_id)
        if job and job.processing_rate and job.total_items and job.processed_items is not None:
            remaining_items = job.total_items - job.processed_items
            if remaining_items > 0 and job.processing_rate > 0:
                minutes_remaining = remaining_items / job.processing_rate
                estimated_completion = datetime.utcnow() + timedelta(minutes=minutes_remaining)
                update_data = JobUpdateRequest(
                    estimated_completion_time=estimated_completion,
                    last_heartbeat=datetime.utcnow()
                )
                return JobService.update_job_sync(db, job_id, update_data)
        return job
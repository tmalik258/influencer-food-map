from typing import List, Optional
from uuid import UUID
from datetime import datetime

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
            started_by=job_data.started_by,
            redis_lock_key=job_data.redis_lock_key,
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
            started_by=job_data.started_by,
            redis_lock_key=job_data.redis_lock_key,
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
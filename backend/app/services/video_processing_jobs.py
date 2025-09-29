from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from app.models.video_processing_job import VideoProcessingJob, VideoProcessingStatus
from app.models.job import JobStatus

class VideoProcessingJobService:
    @staticmethod
    async def create_video_processing_jobs(db: AsyncSession, video_ids: List[str], job_id: UUID) -> List[VideoProcessingJob]:
        """Create video processing job records for tracking individual video processing."""
        video_jobs = []
        for video_id in video_ids:
            video_job = VideoProcessingJob(
                video_id=UUID(video_id),
                job_id=job_id,
                status=VideoProcessingStatus.PENDING
            )
            db.add(video_job)
            video_jobs.append(video_job)
        
        await db.commit()
        return video_jobs

    @staticmethod
    def create_video_processing_jobs_sync(db: Session, video_ids: List[str], job_id: UUID) -> List[VideoProcessingJob]:
        """Create video processing job records for tracking individual video processing (sync version)."""
        video_jobs = []
        for video_id in video_ids:
            video_job = VideoProcessingJob(
                video_id=UUID(video_id),
                job_id=job_id,
                status=VideoProcessingStatus.PENDING
            )
            db.add(video_job)
            video_jobs.append(video_job)
        
        db.commit()
        return video_jobs

    @staticmethod
    async def get_videos_with_active_jobs(db: AsyncSession, video_ids: List[str]) -> List[str]:
        """Get video IDs that have active processing jobs."""
        result = await db.execute(
            select(VideoProcessingJob.video_id)
            .join(VideoProcessingJob.job)
            .where(
                and_(
                    VideoProcessingJob.video_id.in_([UUID(vid) for vid in video_ids]),
                    or_(
                        VideoProcessingJob.status == VideoProcessingStatus.PENDING,
                        VideoProcessingJob.status == VideoProcessingStatus.PROCESSING
                    )
                )
            )
        )
        active_video_ids = result.scalars().all()
        return [str(vid) for vid in active_video_ids]

    @staticmethod
    def get_videos_with_active_jobs_sync(db: Session, video_ids: List[str]) -> List[str]:
        """Get video IDs that have active processing jobs (sync version)."""
        active_video_ids = db.query(VideoProcessingJob.video_id).join(
            VideoProcessingJob.job
        ).filter(
            and_(
                VideoProcessingJob.video_id.in_([UUID(vid) for vid in video_ids]),
                or_(
                    VideoProcessingJob.status == VideoProcessingStatus.PENDING,
                    VideoProcessingJob.status == VideoProcessingStatus.PROCESSING
                )
            )
        ).all()
        return [str(vid[0]) for vid in active_video_ids]

    @staticmethod
    async def update_video_processing_status(db: AsyncSession, video_id: str, job_id: UUID, 
                                           status: VideoProcessingStatus, error_message: Optional[str] = None) -> Optional[VideoProcessingJob]:
        """Update the processing status of a specific video in a job."""
        result = await db.execute(
            select(VideoProcessingJob)
            .where(
                and_(
                    VideoProcessingJob.video_id == UUID(video_id),
                    VideoProcessingJob.job_id == job_id
                )
            )
        )
        video_job = result.scalar_one_or_none()
        
        if video_job:
            video_job.status = status
            if error_message:
                video_job.error_message = error_message
            
            if status == VideoProcessingStatus.PROCESSING:
                video_job.started_at = datetime.utcnow()
            elif status in [VideoProcessingStatus.COMPLETED, VideoProcessingStatus.FAILED, VideoProcessingStatus.SKIPPED]:
                video_job.completed_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(video_job)
        
        return video_job

    @staticmethod
    def update_video_processing_status_sync(db: Session, video_id: str, job_id: UUID, 
                                          status: VideoProcessingStatus, error_message: Optional[str] = None) -> Optional[VideoProcessingJob]:
        """Update the processing status of a specific video in a job (sync version)."""
        video_job = db.query(VideoProcessingJob).filter(
            and_(
                VideoProcessingJob.video_id == UUID(video_id),
                VideoProcessingJob.job_id == job_id
            )
        ).first()
        
        if video_job:
            video_job.status = status
            if error_message:
                video_job.error_message = error_message
            
            if status == VideoProcessingStatus.PROCESSING:
                video_job.started_at = datetime.utcnow()
            elif status in [VideoProcessingStatus.COMPLETED, VideoProcessingStatus.FAILED, VideoProcessingStatus.SKIPPED]:
                video_job.completed_at = datetime.utcnow()
            
            db.commit()
            db.refresh(video_job)
        
        return video_job

    @staticmethod
    async def get_job_video_statuses(db: AsyncSession, job_id: UUID) -> List[VideoProcessingJob]:
        """Get all video processing statuses for a specific job."""
        result = await db.execute(
            select(VideoProcessingJob)
            .where(VideoProcessingJob.job_id == job_id)
            .order_by(VideoProcessingJob.created_at)
        )
        return result.scalars().all()

    @staticmethod
    def get_job_video_statuses_sync(db: Session, job_id: UUID) -> List[VideoProcessingJob]:
        """Get all video processing statuses for a specific job (sync version)."""
        return db.query(VideoProcessingJob).filter(
            VideoProcessingJob.job_id == job_id
        ).order_by(VideoProcessingJob.created_at).all()

    @staticmethod
    async def filter_processable_videos(db: AsyncSession, video_ids: List[str]) -> tuple[List[str], List[str]]:
        """Filter video IDs into processable and already processing lists."""
        active_video_ids = await VideoProcessingJobService.get_videos_with_active_jobs(db, video_ids)
        processable_video_ids = [vid for vid in video_ids if vid not in active_video_ids]
        return processable_video_ids, active_video_ids

    @staticmethod
    def filter_processable_videos_sync(db: Session, video_ids: List[str]) -> tuple[List[str], List[str]]:
        """Filter video IDs into processable and already processing lists (sync version)."""
        active_video_ids = VideoProcessingJobService.get_videos_with_active_jobs_sync(db, video_ids)
        processable_video_ids = [vid for vid in video_ids if vid not in active_video_ids]
        return processable_video_ids, active_video_ids
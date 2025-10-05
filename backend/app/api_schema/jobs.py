from uuid import UUID
from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

from app.models.job import JobStatus, JobType, LockType

class JobResponse(BaseModel):
    id: UUID
    job_type: JobType
    status: JobStatus
    title: str
    description: Optional[str] = None
    progress: int
    total_items: Optional[int] = None
    processed_items: int
    result_data: Optional[str] = None
    error_message: Optional[str] = None
    logs: Optional[str] = None
    redis_lock_key: Optional[str] = None
    
    # Advanced tracking fields
    queue_size: Optional[int] = None
    items_in_progress: Optional[int] = None
    failed_items: Optional[int] = None
    retry_count: Optional[int] = None
    max_retries: Optional[int] = None
    estimated_completion_time: Optional[datetime] = None
    processing_rate: Optional[float] = None
    last_heartbeat: Optional[datetime] = None
    cancellation_requested: bool = False
    cancelled_at: Optional[datetime] = None
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobCancellationRequest(BaseModel):
    """Schema for job cancellation requests."""
    reason: Optional[str] = Field(
        None, 
        description="Reason for cancelling the job",
        example="User requested cancellation"
    )
    force: bool = Field(
        False,
        description="Force cancellation even if job is in critical state"
    )


class JobMetricsResponse(BaseModel):
    """Schema for real-time job metrics."""
    active_jobs: int = Field(description="Number of currently active jobs")
    queued_jobs: int = Field(description="Number of jobs in queue")
    total_items_processing: int = Field(description="Total items being processed across all jobs")
    average_processing_rate: float = Field(
        description="Average processing rate (items per second)"
    )
    system_load: Dict[str, Any] = Field(
        description="System load metrics",
        example={"cpu_usage": 45.2, "memory_usage": 67.8}
    )
    estimated_queue_completion: Optional[datetime] = Field(
        None,
        description="Estimated time when current queue will be completed"
    )

class JobCreateRequest(BaseModel):
    job_type: JobType
    title: str
    description: Optional[str] = None
    total_items: Optional[int] = None
    redis_lock_key: Optional[str] = None
    trigger_type: Optional[LockType] = LockType.SYSTEM

class JobUpdateRequest(BaseModel):
    status: Optional[JobStatus] = None
    progress: Optional[int] = None
    processed_items: Optional[int] = None
    result_data: Optional[str] = None
    error_message: Optional[str] = None
    logs: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Advanced tracking fields
    queue_size: Optional[int] = None
    items_in_progress: Optional[int] = None
    failed_items: Optional[int] = None
    retry_count: Optional[int] = None
    max_retries: Optional[int] = None
    estimated_completion_time: Optional[datetime] = None
    processing_rate: Optional[float] = None
    last_heartbeat: Optional[datetime] = None
    cancellation_requested: Optional[bool] = None
    cancelled_at: Optional[datetime] = None

class CancelJobRequest(BaseModel):
    reason: Optional[str] = None

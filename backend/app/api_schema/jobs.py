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
    started_by: Optional[str] = None
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
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    
    created_at: datetime
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


class JobAnalyticsResponse(BaseModel):
    """Schema for job analytics and statistics."""
    total_jobs: int = Field(description="Total number of jobs")
    jobs_by_status: Dict[str, int] = Field(
        description="Job counts grouped by status",
        example={"pending": 5, "running": 2, "completed": 10, "failed": 1}
    )
    jobs_by_type: Dict[str, int] = Field(
        description="Job counts grouped by type",
        example={"scrape_youtube": 8, "transcription_nlp": 10}
    )
    average_completion_time: Optional[float] = Field(
        None,
        description="Average completion time in seconds"
    )
    success_rate: float = Field(
        description="Success rate as percentage",
        example=85.5
    )
    most_active_users: List[Dict[str, Any]] = Field(
        description="Users who started the most jobs",
        example=[{"user": "admin", "count": 15}]
    )
    recent_activity: List[Dict[str, Any]] = Field(
        description="Recent job activity",
        example=[{"job_id": "123", "status": "completed", "timestamp": "2024-01-01T12:00:00Z"}]
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


class ActiveJobResponse(BaseModel):
    """Schema for active jobs with extended information."""
    id: UUID
    job_type: JobType
    status: JobStatus
    title: str
    progress: int
    total_items: Optional[int] = None
    processed_items: int
    queue_size: Optional[int] = None
    items_in_progress: Optional[int] = None
    processing_rate: Optional[float] = None
    estimated_completion_time: Optional[datetime] = None
    last_heartbeat: Optional[datetime] = None
    started_by: Optional[str] = None
    started_at: Optional[datetime] = None
    runtime_seconds: Optional[int] = Field(
        None,
        description="How long the job has been running in seconds"
    )
    
    model_config = ConfigDict(from_attributes=True)


class JobFilterRequest(BaseModel):
    """Schema for advanced job filtering parameters."""
    status: Optional[List[JobStatus]] = Field(
        None,
        description="Filter by job statuses"
    )
    job_type: Optional[List[JobType]] = Field(
        None,
        description="Filter by job types"
    )
    started_by: Optional[List[str]] = Field(
        None,
        description="Filter by users who started the jobs"
    )
    created_after: Optional[datetime] = Field(
        None,
        description="Filter jobs created after this date"
    )
    created_before: Optional[datetime] = Field(
        None,
        description="Filter jobs created before this date"
    )
    completed_after: Optional[datetime] = Field(
        None,
        description="Filter jobs completed after this date"
    )
    completed_before: Optional[datetime] = Field(
        None,
        description="Filter jobs completed before this date"
    )
    min_progress: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Minimum progress percentage"
    )
    max_progress: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Maximum progress percentage"
    )
    has_errors: Optional[bool] = Field(
        None,
        description="Filter jobs that have errors"
    )
    cancellation_requested: Optional[bool] = Field(
        None,
        description="Filter jobs with cancellation requests"
    )
    sort_by: Optional[str] = Field(
        "created_at",
        description="Field to sort by",
        example="created_at"
    )
    sort_order: Optional[str] = Field(
        "desc",
        description="Sort order (asc or desc)",
        example="desc"
    )
    skip: int = Field(
        0,
        ge=0,
        description="Number of records to skip"
    )
    limit: int = Field(
        100,
        ge=1,
        le=1000,
        description="Maximum number of records to return"
    )

class JobCreateRequest(BaseModel):
    job_type: JobType
    title: str
    description: Optional[str] = None
    total_items: Optional[int] = None
    started_by: Optional[str] = None
    redis_lock_key: Optional[str] = None
    trigger_type: Optional[LockType] = LockType.AUTOMATIC

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
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None

class JobListResponse(BaseModel):
    id: UUID
    job_type: JobType
    status: JobStatus
    title: str
    progress: int
    total_items: Optional[int] = None
    processed_items: int
    started_by: Optional[str] = None
    
    # Key tracking fields for list view
    queue_size: Optional[int] = None
    items_in_progress: Optional[int] = None
    failed_items: Optional[int] = None
    retry_count: Optional[int] = None
    processing_rate: Optional[float] = None
    cancellation_requested: bool = False
    cancelled_by: Optional[str] = None
    
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CancelJobRequest(BaseModel):
    reason: Optional[str] = None


class TrackingStatsRequest(BaseModel):
    queue_size: Optional[int] = None
    items_in_progress: Optional[int] = None
    failed_items: Optional[int] = None
    processing_rate: Optional[float] = None
    estimated_completion_time: Optional[datetime] = None


class JobAnalyticsResponse(BaseModel):
    completion_rates_by_type: dict
    average_processing_times: dict
    success_failure_ratios: dict
    processing_rate_statistics: dict
    queue_metrics: dict
    total_jobs: int
    period_analyzed: str


class ActiveJobsResponse(BaseModel):
    active_jobs: List[JobResponse]
    total_active: int
    jobs_with_cancellation_requests: int
    average_progress: float
    total_queue_size: int
    total_items_in_progress: int


class CleanupStaleJobsResponse(BaseModel):
    cleaned_jobs: List[JobResponse]
    total_cleaned: int
    threshold_minutes: int
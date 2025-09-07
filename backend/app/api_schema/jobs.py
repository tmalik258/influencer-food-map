from uuid import UUID
from typing import Optional
from datetime import datetime

from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.models.job import JobStatus, JobType

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
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobCreateRequest(BaseModel):
    job_type: JobType
    title: str
    description: Optional[str] = None
    total_items: Optional[int] = None
    started_by: Optional[str] = None
    redis_lock_key: Optional[str] = None

class JobUpdateRequest(BaseModel):
    status: Optional[JobStatus] = None
    progress: Optional[int] = None
    processed_items: Optional[int] = None
    result_data: Optional[str] = None
    error_message: Optional[str] = None
    logs: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class JobListResponse(BaseModel):
    id: UUID
    job_type: JobType
    status: JobStatus
    title: str
    progress: int
    total_items: Optional[int] = None
    processed_items: int
    started_by: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
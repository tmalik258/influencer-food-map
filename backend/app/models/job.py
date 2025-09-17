import uuid
from enum import Enum

from sqlalchemy import (Column, UUID, String, Text, DateTime, Boolean, Integer, Enum as SQLEnum)
from sqlalchemy.sql import func

from app.database import Base

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobType(str, Enum):
    SCRAPE_YOUTUBE = "scrape_youtube"
    TRANSCRIPTION_NLP = "transcription_nlp"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type = Column(SQLEnum(JobType), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    progress = Column(Integer, default=0)  # Progress percentage (0-100)
    total_items = Column(Integer, nullable=True)  # Total items to process
    processed_items = Column(Integer, default=0)  # Items processed so far
    result_data = Column(Text, nullable=True)  # JSON string of result data
    error_message = Column(Text, nullable=True)  # Error details if failed
    logs = Column(Text, nullable=True)  # Detailed logs
    started_by = Column(String(255), nullable=True)  # User who started the job
    redis_lock_key = Column(String(255), nullable=True)  # Redis lock key if applicable
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
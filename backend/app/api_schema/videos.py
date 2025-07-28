from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

class VideoResponse(BaseModel):
    id: UUID
    influencer_id: Optional[UUID] = None
    youtube_video_id: str
    title: str
    description: Optional[str] = None
    video_url: str
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
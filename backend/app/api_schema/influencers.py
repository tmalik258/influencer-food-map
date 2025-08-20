from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

class InfluencerResponse(BaseModel):
    id: UUID
    name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    region: Optional[str] = None
    youtube_channel_id: str
    youtube_channel_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
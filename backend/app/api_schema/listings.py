from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel
from pydantic.config import ConfigDict

class ListingResponse(BaseModel):
    id: UUID
    restaurant_id: Optional[UUID] = None
    video_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
from uuid import UUID
from typing import List, Optional
from datetime import date, datetime

from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.api_schema.videos import VideoResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.influencers import InfluencerResponse

class ListingResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse
    video: VideoResponse
    influencer: InfluencerResponse
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
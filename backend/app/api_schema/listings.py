from uuid import UUID
from typing import List, Optional
from datetime import date, datetime

from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.api_schema.videos import VideoResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.influencers import InfluencerResponse, InfluencerLightResponse

class ListingResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse | UUID
    video: Optional[VideoResponse | UUID] = None
    influencer: Optional[InfluencerResponse | UUID] = None
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None
    context: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ListingLightResponse(BaseModel):
    id: UUID
    restaurant_id: Optional[UUID] = None
    video: Optional[VideoResponse | UUID] = None
    influencer: Optional[InfluencerLightResponse | UUID] = None
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None
    context: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

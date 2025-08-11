from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

from app.api_schema.tags import TagResponse

class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    address: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    google_place_id: Optional[str] = None
    google_rating: Optional[float] = None
    business_status: str
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    tags: Optional[list[TagResponse]] = None

    model_config = ConfigDict(from_attributes=True)
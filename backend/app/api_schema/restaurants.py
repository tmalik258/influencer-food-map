from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    branch_name: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    google_place_id: Optional[str] = None
    google_rating: Optional[float] = None
    business_status: str
    is_active: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
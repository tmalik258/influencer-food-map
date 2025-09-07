from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

if TYPE_CHECKING:
    from app.api_schema.listings import ListingLightResponse

class InfluencerResponse(BaseModel):
    id: UUID
    name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    # region: Optional[str] = None
    # country: Optional[str] = None
    youtube_channel_id: str
    youtube_channel_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    listings: Optional[List["ListingLightResponse"]] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedInfluencersResponse(BaseModel):
    """Response model for paginated influencers with total count"""
    influencers: List[InfluencerResponse]
    total: int
    
    model_config = ConfigDict(from_attributes=True)

# Import after class definition to avoid circular imports
def rebuild_models():
    """Rebuild models to resolve forward references after all imports are complete"""
    from app.api_schema.listings import ListingLightResponse
    InfluencerResponse.model_rebuild()
    PaginatedInfluencersResponse.model_rebuild()

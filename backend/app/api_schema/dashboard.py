from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DashboardStatsResponse(BaseModel):
    """Optimized dashboard statistics response with only essential metrics."""
    
    # Core metrics
    total_restaurants: int = Field(..., description="Total number of active restaurants")
    total_influencers: int = Field(..., description="Total number of influencers")
    total_listings: int = Field(..., description="Total number of approved listings")
    total_videos: int = Field(..., description="Total number of videos")
    
    # Additional computed metrics
    approved_listings: int = Field(..., description="Number of approved listings")
    pending_listings: int = Field(..., description="Number of pending listings")
    active_restaurants_with_listings: int = Field(..., description="Restaurants that have at least one listing")
    influencers_with_videos: int = Field(..., description="Influencers who have uploaded videos")
    
    # Recent activity metrics
    listings_this_month: int = Field(..., description="Listings created this month")
    videos_this_month: int = Field(..., description="Videos added this month")
    restaurants_this_month: int = Field(..., description="Restaurants added this month")
    
    # Geographic distribution
    total_cities: int = Field(..., description="Number of unique cities with restaurants")
    total_countries: int = Field(..., description="Number of unique countries with restaurants")
    
    # Data freshness
    last_updated: datetime = Field(..., description="Timestamp when data was computed")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "total_restaurants": 150,
                "total_influencers": 25,
                "total_listings": 300,
                "total_videos": 180,
                "approved_listings": 280,
                "pending_listings": 20,
                "active_restaurants_with_listings": 120,
                "influencers_with_videos": 22,
                "listings_this_month": 15,
                "videos_this_month": 12,
                "restaurants_this_month": 8,
                "total_cities": 45,
                "total_countries": 12,
                "last_updated": "2024-01-15T10:30:00Z"
            }
        }
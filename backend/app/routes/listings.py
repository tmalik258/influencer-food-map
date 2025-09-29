from enum import Enum
import json
from typing import List

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy import select, delete, desc
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (Listing, Influencer, Restaurant, RestaurantTag, RestaurantCuisine, Cuisine, Video)
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.utils.logging import setup_logger
from app.api_schema.videos import VideoResponse
from app.api_schema.listings import ListingResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.influencers import InfluencerLightResponse, InfluencerResponse
from app.api_schema.tags import TagResponse
from app.api_schema.cuisines import CuisineResponse

logger = setup_logger(__name__)
router = APIRouter()

class ApprovedStatus(str, Enum):
    APPROVED = "Approved"
    NOT_APPROVED = "Not Approved"
    ALL = "All"

@router.get("/", response_model=List[ListingResponse])
async def get_listings(
    db: AsyncSession = Depends(get_async_db),
    id: str | None = None,
    restaurant_id: str | None = None,
    video_id: str | None = None,
    influencer_id: str | None = None,
    influencer_name: str | None = None,
    approved_status: ApprovedStatus = ApprovedStatus.ALL,
    sort_by_published_date: bool = False,
    skip: int = 0,
    limit: int = 100
):
    """Get approved listings with filters for ID, restaurant ID, video ID, influencer ID, or influencer name."""
    try:
        query = select(Listing).options(
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Listing.video),
            joinedload(Listing.influencer)
        )

        if approved_status == ApprovedStatus.APPROVED:
            query = query.filter(Listing.approved == True)
        elif approved_status == ApprovedStatus.NOT_APPROVED:
            query = query.filter(Listing.approved == False)
        # If approved_status is ApprovedStatus.ALL, no filter is applied

        if id:
            query = query.filter(Listing.id == id)
        if restaurant_id:
            query = query.filter(Listing.restaurant_id == restaurant_id)
        if video_id:
            query = query.filter(Listing.video_id == video_id)
        if influencer_id:
            query = query.filter(Listing.influencer_id == influencer_id)
        if influencer_name:
            query = query.join(Influencer).filter(Influencer.name.ilike(f"%{influencer_name}%"))

        # Sort by published date if requested
        if sort_by_published_date:
            query = query.join(Video).order_by(desc(Video.published_at))

        # Apply limit if specified, otherwise use default
        final_limit = limit if limit is not None else 100
        query = query.offset(skip).limit(final_limit)
        result = await db.execute(query)
        listings = result.scalars().unique().all()

        if not listings:
            logger.error(f"Failed to fetch listings with filters")
            raise HTTPException(status_code=404, detail="No listings found")

        # Manually construct response objects to avoid circular dependencies
        response_listings = []
        for listing in listings:
            # Process tags
            tags = None
            if listing.restaurant.restaurant_tags:
                tags = [TagResponse(
                    id=rt.tag.id,
                    name=rt.tag.name,
                    created_at=rt.tag.created_at
                ) for rt in listing.restaurant.restaurant_tags]
            
            # Process cuisines
            cuisines = None
            if listing.restaurant.restaurant_cuisines:
                cuisines = [CuisineResponse(
                    id=rc.cuisine.id,
                    name=rc.cuisine.name,
                    created_at=rc.cuisine.created_at
                ) for rc in listing.restaurant.restaurant_cuisines]
            
            # Construct RestaurantResponse manually
            restaurant_response = RestaurantResponse(
                id=listing.restaurant.id,
                name=listing.restaurant.name,
                address=listing.restaurant.address,
                latitude=listing.restaurant.latitude,
                longitude=listing.restaurant.longitude,
                city=listing.restaurant.city,
                country=listing.restaurant.country,
                google_place_id=listing.restaurant.google_place_id,
                google_rating=listing.restaurant.google_rating,
                business_status=listing.restaurant.business_status,
                photo_url=listing.restaurant.photo_url,
                is_active=listing.restaurant.is_active,
                created_at=listing.restaurant.created_at,
                updated_at=listing.restaurant.updated_at,
                tags=tags,
                cuisines=cuisines,
                listings=None  # Prevent circular dependency
            )

            # Construct VideoResponse manually if video exists
            video_response = None
            if listing.video:
                # Get influencer data for the video
                video_influencer_response = None
                if listing.video.influencer:
                    video_influencer_response = InfluencerLightResponse(
                        id=listing.video.influencer.id,
                        name=listing.video.influencer.name,
                        bio=listing.video.influencer.bio,
                        avatar_url=listing.video.influencer.avatar_url,
                        banner_url=listing.video.influencer.banner_url,
                        youtube_channel_id=listing.video.influencer.youtube_channel_id,
                        youtube_channel_url=listing.video.influencer.youtube_channel_url,
                        subscriber_count=listing.video.influencer.subscriber_count,
                        created_at=listing.video.influencer.created_at,
                        updated_at=listing.video.influencer.updated_at
                    )
                
                video_response = VideoResponse(
                    id=listing.video.id,
                    influencer=video_influencer_response,
                    youtube_video_id=listing.video.youtube_video_id,
                    title=listing.video.title,
                    description=listing.video.description,
                    video_url=listing.video.video_url,
                    published_at=listing.video.published_at,
                    transcription=listing.video.transcription,
                    created_at=listing.video.created_at,
                    updated_at=listing.video.updated_at
                )

            # Construct InfluencerResponse manually if influencer exists
            influencer_response = None
            if listing.influencer:
                influencer_response = InfluencerResponse(
                    id=listing.influencer.id,
                    name=listing.influencer.name,
                    bio=listing.influencer.bio,
                    avatar_url=listing.influencer.avatar_url,
                    banner_url=listing.influencer.banner_url,
                    # region=listing.influencer.region,
                    # country=listing.influencer.country,
                    youtube_channel_id=listing.influencer.youtube_channel_id,
                    youtube_channel_url=listing.influencer.youtube_channel_url,
                    subscriber_count=listing.influencer.subscriber_count,
                    created_at=listing.influencer.created_at,
                    updated_at=listing.influencer.updated_at,
                    listings=None  # Prevent circular dependency
                )

            # Construct ListingResponse manually
            listing_response = ListingResponse(
                id=listing.id,
                restaurant=restaurant_response,
                video=video_response,
                influencer=influencer_response,
                visit_date=listing.visit_date,
                quotes=listing.quotes,
                context=listing.context,
                confidence_score=listing.confidence_score,
                approved=listing.approved,
                created_at=listing.created_at,
                updated_at=listing.updated_at
            )
            response_listings.append(listing_response)

        return response_listings
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        print(f"Error fetching listings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch listings. Please try again later.")

@router.get("/{listing_id}/", response_model=ListingResponse)
async def get_listing(listing_id: str, db: AsyncSession = Depends(get_async_db)):
    """Get a single approved listing by ID."""
    try:
        query = select(Listing).options(
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Listing.restaurant).joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Listing.video),
            joinedload(Listing.influencer)
        ).filter(Listing.id == listing_id, Listing.approved == True)
        
        result = await db.execute(query)
        listing = result.scalars().unique().first()

        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Process tags
        tags = None
        if listing.restaurant.restaurant_tags:
            tags = [TagResponse(
                id=rt.tag.id,
                name=rt.tag.name,
                created_at=rt.tag.created_at
            ) for rt in listing.restaurant.restaurant_tags]
        
        # Process cuisines
        cuisines = None
        if listing.restaurant.restaurant_cuisines:
            cuisines = [CuisineResponse(
                id=rc.cuisine.id,
                name=rc.cuisine.name,
                created_at=rc.cuisine.created_at
            ) for rc in listing.restaurant.restaurant_cuisines]
        
        # Construct RestaurantResponse manually
        restaurant_response = RestaurantResponse(
            id=listing.restaurant.id,
            name=listing.restaurant.name,
            address=listing.restaurant.address,
            latitude=listing.restaurant.latitude,
            longitude=listing.restaurant.longitude,
            city=listing.restaurant.city,
            country=listing.restaurant.country,
            google_place_id=listing.restaurant.google_place_id,
            google_rating=listing.restaurant.google_rating,
            business_status=listing.restaurant.business_status,
            photo_url=listing.restaurant.photo_url,
            is_active=listing.restaurant.is_active,
            created_at=listing.restaurant.created_at,
            updated_at=listing.restaurant.updated_at,
            tags=tags,
            cuisines=cuisines,
            listings=None  # Prevent circular dependency
        )

        # Construct VideoResponse manually if video exists
        video_response = None
        if listing.video:
            # Get influencer data for the video
            video_influencer_response = None
            if listing.video.influencer:
                video_influencer_response = InfluencerLightResponse(
                    id=listing.video.influencer.id,
                    name=listing.video.influencer.name,
                    bio=listing.video.influencer.bio,
                    avatar_url=listing.video.influencer.avatar_url,
                    banner_url=listing.video.influencer.banner_url,
                    youtube_channel_id=listing.video.influencer.youtube_channel_id,
                    youtube_channel_url=listing.video.influencer.youtube_channel_url,
                    subscriber_count=listing.video.influencer.subscriber_count,
                    created_at=listing.video.influencer.created_at,
                    updated_at=listing.video.influencer.updated_at
                )
            
            video_response = VideoResponse(
                id=listing.video.id,
                influencer=video_influencer_response,
                youtube_video_id=listing.video.youtube_video_id,
                title=listing.video.title,
                description=listing.video.description,
                video_url=listing.video.video_url,
                published_at=listing.video.published_at,
                transcription=listing.video.transcription,
                created_at=listing.video.created_at,
                updated_at=listing.video.updated_at
            )

        # Construct InfluencerResponse manually if influencer exists
        influencer_response = None
        if listing.influencer:
            influencer_response = InfluencerResponse(
                id=listing.influencer.id,
                name=listing.influencer.name,
                bio=listing.influencer.bio,
                avatar_url=listing.influencer.avatar_url,
                banner_url=listing.influencer.banner_url,
                # region=listing.influencer.region,
                # country=listing.influencer.country,
                youtube_channel_id=listing.influencer.youtube_channel_id,
                youtube_channel_url=listing.influencer.youtube_channel_url,
                subscriber_count=listing.influencer.subscriber_count,
                created_at=listing.influencer.created_at,
                updated_at=listing.influencer.updated_at,
                listings=None  # Prevent circular dependency
            )

        # Construct ListingResponse manually
        listing_response = ListingResponse(
            id=listing.id,
            restaurant=restaurant_response,
            video=video_response,
            influencer=influencer_response,
            visit_date=listing.visit_date,
            quotes=listing.quotes,
            context=listing.context,
            confidence_score=listing.confidence_score,
            approved=listing.approved,
            created_at=listing.created_at,
            updated_at=listing.updated_at
        )

        return listing_response
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        print(f"Error fetching listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch listing. Please try again later.")

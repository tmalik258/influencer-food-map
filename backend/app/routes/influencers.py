from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Influencer, Listing, Video
from app.database import get_async_db
from app.utils.logging import setup_logger
from app.api_schema.influencers import InfluencerLightResponse, InfluencerResponse, PaginatedInfluencersResponse, rebuild_models
from app.api_schema.listings import ListingLightResponse
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.videos import VideoResponse

# Rebuild models to resolve forward references
rebuild_models()

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/", response_model=PaginatedInfluencersResponse)
async def get_influencers(
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    id: str | None = None,
    youtube_channel_id: str | None = None,
    youtube_channel_url: str | None = None,
    skip: int = 0,
    limit: int = 100,
    include_listings: Optional[bool] = Query(False, description="Include listings with influencers"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details (description, transcription, summary)")
):
    """Get influencers with filters for name, ID, YouTube channel ID, or URL."""
    try:
        # Base query for counting total records
        count_query = select(Influencer)
        
        # Apply filters to count query
        if name:
            count_query = count_query.filter(Influencer.name.ilike(f"%{name}%"))
        if id:
            count_query = count_query.filter(Influencer.id == id)
        if youtube_channel_id:
            count_query = count_query.filter(Influencer.youtube_channel_id == youtube_channel_id)
        if youtube_channel_url:
            count_query = count_query.filter(Influencer.youtube_channel_url == youtube_channel_url)
        
        # Get total count
        total_count_query = select(func.count()).select_from(count_query.subquery())
        total_result = await db.execute(total_count_query)
        total_count = total_result.scalar()
        
        # Base query for actual data
        query = select(Influencer)
        
        # Add listings if requested
        if include_listings:
            if include_video_details:
                query = query.options(
                    joinedload(Influencer.listings)
                    .joinedload(Listing.video),
                    joinedload(Influencer.listings)
                    .joinedload(Listing.restaurant)
                )
            else:
                query = query.options(
                    joinedload(Influencer.listings)
                    .joinedload(Listing.video),
                    joinedload(Influencer.listings)
                    .joinedload(Listing.restaurant)
                )

        # Apply same filters to data query
        if name:
            query = query.filter(Influencer.name.ilike(f"%{name}%"))
        if id:
            query = query.filter(Influencer.id == id)
        if youtube_channel_id:
            query = query.filter(Influencer.youtube_channel_id == youtube_channel_id)
        if youtube_channel_url:
            query = query.filter(Influencer.youtube_channel_url == youtube_channel_url)

        result = await db.execute(query.offset(skip).limit(limit))
        influencers = result.unique().scalars().all()

        # Return empty result with total count if no influencers found
        if not influencers:
            return PaginatedInfluencersResponse(influencers=[], total=total_count)

        # Get video counts for all influencers in one query
        influencer_ids = [inf.id for inf in influencers]
        video_count_query = select(
            Video.influencer_id,
            func.count(Video.id).label('video_count')
        ).filter(
            Video.influencer_id.in_(influencer_ids)
        ).group_by(Video.influencer_id)
        
        video_count_result = await db.execute(video_count_query)
        video_counts = {row.influencer_id: row.video_count for row in video_count_result}

        # Convert to response format
        result_list = []
        for influencer in influencers:
            # Create influencer data without listings first
            influencer_data = InfluencerResponse(
                id=influencer.id,
                name=influencer.name,
                bio=influencer.bio,
                avatar_url=influencer.avatar_url,
                banner_url=influencer.banner_url,
                # region=influencer.region,
                # country=influencer.country,
                youtube_channel_id=influencer.youtube_channel_id,
                youtube_channel_url=influencer.youtube_channel_url,
                subscriber_count=influencer.subscriber_count,
                total_videos=video_counts.get(influencer.id, 0),
                created_at=influencer.created_at,
                updated_at=influencer.updated_at,
                listings=None
            )
            
            if include_listings and influencer.listings:
                listings_data = []
                for listing in influencer.listings:
                    if include_video_details:
                        # Manually construct RestaurantResponse to avoid lazy loading issues
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
                            tags=None,  # Avoid lazy loading
                            listings=None  # Avoid lazy loading
                        )
                        
                        # Manually construct VideoResponse to avoid lazy loading issues
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
                        
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant=restaurant_response,
                            video=video_response,
                            influencer_id=listing.influencer.id,
                            visit_date=listing.visit_date,
                            quotes=listing.quotes,
                            context=listing.context,
                            confidence_score=listing.confidence_score,
                            approved=listing.approved,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                    else:
                        # Manually construct RestaurantResponse to avoid lazy loading issues
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
                            tags=None,  # Avoid lazy loading
                            listings=None  # Avoid lazy loading
                        )
                        
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant=restaurant_response,
                            influencer_id=listing.influencer.id,
                            video=listing.video.id,
                            visit_date=listing.visit_date,
                            quotes=listing.quotes,
                            context=listing.context,
                            confidence_score=listing.confidence_score,
                            approved=listing.approved,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                    listings_data.append(listing_response)
                influencer_data.listings = listings_data
            
            result_list.append(influencer_data)

        return PaginatedInfluencersResponse(influencers=result_list, total=total_count)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching influencers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching influencers")

@router.get("/{influencer_id}/", response_model=InfluencerResponse)
async def get_influencer(
    influencer_id: str,
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with influencer"),
    include_video_details: Optional[bool] = Query(True, description="Include full video details (description, transcription, summary)")
):
    """Get a single influencer by ID."""
    try:
        # Base query
        query = select(Influencer)
        
        # Add listings if requested
        if include_listings:
            query = query.options(
                joinedload(Influencer.listings)
                .joinedload(Listing.video),
                joinedload(Influencer.listings)
                .joinedload(Listing.restaurant)
            )
        
        result = await db.execute(query.filter(Influencer.id == influencer_id))
        influencer = result.unique().scalars().first()

        if not influencer:
            raise HTTPException(status_code=404, detail="Influencer not found")

        # Get video count for this influencer
        video_count_query = select(func.count(Video.id)).filter(Video.influencer_id == influencer.id)
        video_count_result = await db.execute(video_count_query)
        video_count = video_count_result.scalar() or 0

        # Convert to response format - manually construct to avoid lazy loading issues
        influencer_data = InfluencerResponse(
            id=influencer.id,
            name=influencer.name,
            bio=influencer.bio,
            avatar_url=influencer.avatar_url,
            banner_url=influencer.banner_url,
            # region=influencer.region,
            # country=influencer.country,
            youtube_channel_id=influencer.youtube_channel_id,
            youtube_channel_url=influencer.youtube_channel_url,
            subscriber_count=influencer.subscriber_count,
            total_videos=video_count,
            created_at=influencer.created_at,
            updated_at=influencer.updated_at,
            listings=None  # Explicitly set to None to avoid lazy loading
        )
        
        if include_listings and influencer.listings:
            listings_data = []
            for listing in influencer.listings:
                if include_video_details:
                    # Manually construct RestaurantResponse to avoid lazy loading issues
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
                        tags=None,  # Avoid lazy loading
                        listings=None  # Avoid lazy loading
                    )
                    
                    # Manually construct VideoResponse to avoid lazy loading issues
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
                    
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=restaurant_response,
                        video=video_response,
                        influencer_id=listing.influencer.id,
                        visit_date=listing.visit_date,
                        quotes=listing.quotes,
                        context=listing.context,
                        confidence_score=listing.confidence_score,
                        approved=listing.approved,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                else:
                    # Manually construct RestaurantResponse to avoid lazy loading issues
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
                        tags=None,  # Avoid lazy loading
                        listings=None  # Avoid lazy loading
                    )
                    
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=restaurant_response,
                        video=listing.video.id,
                        influencer_id=listing.influencer.id,
                        visit_date=listing.visit_date,
                        quotes=listing.quotes,
                        context=listing.context,
                        confidence_score=listing.confidence_score,
                        approved=listing.approved,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                listings_data.append(listing_response)
            influencer_data.listings = listings_data
        
        return influencer_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching influencer {influencer_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching influencer")

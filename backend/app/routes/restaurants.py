import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantTag, Listing
from app.database import get_async_db, get_db
from app.utils.logging import setup_logger
from app.api_schema.tags import TagResponse
from app.api_schema.videos import VideoResponse
from app.api_schema.listings import ListingLightResponse
from app.api_schema.influencers import InfluencerResponse
from app.api_schema.restaurants import RestaurantResponse, OptimizedFeaturedResponse, CityRestaurantsResponse, rebuild_models

# Rebuild models to resolve forward references
rebuild_models()

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/", response_model=List[RestaurantResponse])
async def get_restaurants(
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    id: str | None = None,
    city: str | None = None,
    country: str | None = None,
    google_place_id: str | None = None,
    skip: int = 0,
    limit: int = 10,
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurants"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details (description, transcription, summary)")
):
    """Get restaurants with filters for name, ID, city, country, or Google Place ID."""
    try:
        # Base query
        query = select(Restaurant).filter(Restaurant.is_active == True)

        # Always eagerly load restaurant_tags and their related tag objects
        query = query.options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag)
        )
        
        # Add listings if requested
        if include_listings:
            if include_video_details:
                query = query.options(
                    joinedload(Restaurant.listings)
                    .joinedload(Listing.video),
                    joinedload(Restaurant.listings)
                    .joinedload(Listing.influencer)
                )
            else:
                query = query.options(
                    joinedload(Restaurant.listings)
                    .joinedload(Listing.video),
                    joinedload(Restaurant.listings)
                    .joinedload(Listing.influencer)
                )

        if name:
            query = query.filter(Restaurant.name.ilike(f"%{name}%"))
        if id:
            query = query.filter(Restaurant.id == id)
        if city:
            query = query.filter(Restaurant.city.ilike(f"%{city}%"))
        if country:
            query = query.filter(Restaurant.country == country)
        if google_place_id:
            query = query.filter(Restaurant.google_place_id == google_place_id)

        result = await db.execute(query.offset(skip).limit(limit))
        restaurants = result.unique().scalars().all()

        # Convert to response format
        result_list = []
        for restaurant in restaurants:
            # Process tags safely - access within the session context
            tags = None
            try:
                if restaurant.restaurant_tags:
                    tags = []
                    for restaurant_tag in restaurant.restaurant_tags:
                        tag_data = {
                            'id': restaurant_tag.tag.id,
                            'name': restaurant_tag.tag.name,
                            'created_at': restaurant_tag.tag.created_at,
                        }
                        tags.append(TagResponse(**tag_data))
            except Exception as tag_error:
                logger.warning(f"Error processing tags for restaurant {restaurant.id}: {tag_error}")
                tags = None

            # Create restaurant data without listings first
            restaurant_data = RestaurantResponse(
                id=restaurant.id,
                name=restaurant.name,
                address=restaurant.address,
                latitude=restaurant.latitude,
                longitude=restaurant.longitude,
                city=restaurant.city,
                country=restaurant.country,
                google_place_id=restaurant.google_place_id,
                google_rating=restaurant.google_rating,
                business_status=restaurant.business_status,
                photo_url=restaurant.photo_url,
                is_active=restaurant.is_active,
                created_at=restaurant.created_at,
                updated_at=restaurant.updated_at,
                tags=tags,
                listings=None
            )
            
            if include_listings and restaurant.listings:
                listings_data = []
                for listing in restaurant.listings:
                    if include_video_details:
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            video=VideoResponse.model_validate(listing.video),
                            influencer=InfluencerResponse.model_validate(listing.influencer),
                            visit_date=listing.visit_date,
                            quotes=listing.quotes,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                    else:
                        listing_response = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            influencer=InfluencerResponse.model_validate(listing.influencer),
                            video=listing.video.id,
                            visit_date=listing.visit_date,
                            quotes=listing.quotes,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                    listings_data.append(listing_response)
                restaurant_data.listings = listings_data
            
            result_list.append(restaurant_data)

        return result_list

    except Exception as e:
        logger.error(f"Error fetching restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants. Please try again later.")

@router.get("/popular_cities/", response_model=List[str])
def get_popular_cities(db: Session = Depends(get_db)):
    """Get the top 5 cities with the most restaurant listings."""
    try:
        popular_cities = db.query(Restaurant.city).filter(
            Restaurant.is_active == True,
            Restaurant.city.isnot(None)
        ).group_by(Restaurant.city).order_by(func.count(Restaurant.city).desc()).limit(5).all()
        return [city[0] for city in popular_cities]
    except Exception as e:
        # Log the error and return default cities if database query fails
        logger.error(f"Error fetching popular cities: {e}")
        return []

@router.get("/featured-optimized/", response_model=OptimizedFeaturedResponse)
def get_featured_optimized(db: Session = Depends(get_db)):
    """Get top 5 cities with 3 latest restaurants each in a single optimized call.
    
    Enhanced implementation that:
    - Retrieves complete restaurant information including all fields and associated tags
    - Includes optimized listings with influencer details only (excludes restaurant and video data)
    - Maintains data integrity while significantly improving API efficiency and performance
    """
    try:
        # Get top 5 cities with most restaurants in a single query
        popular_cities = db.query(
            Restaurant.city
        ).filter(
            Restaurant.is_active == True,
            Restaurant.city.isnot(None)
        ).group_by(Restaurant.city).order_by(
            func.count(Restaurant.city).desc()
        ).limit(5).all()
        
        # popular_cities = db.query(popular_cities_subquery.c.city).all()
        
        if not popular_cities:
            return OptimizedFeaturedResponse(cities=[])
        
        city_names = [city[0] for city in popular_cities]
        
        # Single optimized query to get all restaurants for all cities with proper joins
        # Using window function to get top 3 restaurants per city efficiently
        restaurants_query = db.query(Restaurant).options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.listings).joinedload(Listing.influencer)
        ).filter(
            Restaurant.city.in_(city_names),
            Restaurant.is_active == True
        ).order_by(Restaurant.city, Restaurant.created_at.desc())
        
        all_restaurants = restaurants_query.all()
        
        # Group restaurants by city and limit to 3 per city
        city_restaurant_map = {}
        for restaurant in all_restaurants:
            city = restaurant.city
            if city not in city_restaurant_map:
                city_restaurant_map[city] = []
            if len(city_restaurant_map[city]) < 3:
                city_restaurant_map[city].append(restaurant)
        
        # Build response with optimized data structure
        city_restaurants = []
        for city in city_names:
            if city not in city_restaurant_map:
                continue
                
            restaurants = city_restaurant_map[city]
            restaurant_responses = []
            
            for restaurant in restaurants:
                # Convert SQLAlchemy object to dictionary for clean serialization
                restaurant_dict = {
                    'id': restaurant.id,
                    'name': restaurant.name,
                    'address': restaurant.address,
                    'latitude': restaurant.latitude,
                    'longitude': restaurant.longitude,
                    'city': restaurant.city,
                    'country': restaurant.country,
                    'google_place_id': restaurant.google_place_id,
                    'google_rating': restaurant.google_rating,
                    'business_status': restaurant.business_status,
                    'photo_url': restaurant.photo_url,
                    'is_active': restaurant.is_active,
                    'created_at': restaurant.created_at,
                    'updated_at': restaurant.updated_at
                }
                
                # Process optimized listings (exclude restaurant and video data)
                listings_data = []
                for listing in restaurant.listings:
                    if listing.influencer:
                        # Create optimized listing with only essential data
                        listing_optimized = ListingLightResponse(
                            id=listing.id,
                            restaurant_id=listing.restaurant.id,
                            influencer=InfluencerResponse.model_validate(listing.influencer),
                            visit_date=listing.visit_date,
                            quotes=listing.quotes,
                            context=listing.context,
                            confidence_score=listing.confidence_score,
                            approved=listing.approved,
                            created_at=listing.created_at,
                            updated_at=listing.updated_at
                        )
                        listings_data.append(listing_optimized)

                restaurant_dict['listings'] = listings_data
                
                # Process tags with complete data integrity
                tags_data = []
                if restaurant.restaurant_tags:
                    for restaurant_tag in restaurant.restaurant_tags:
                        if restaurant_tag.tag:
                            tags_data.append(TagResponse.model_validate(restaurant_tag.tag))
                restaurant_dict['tags'] = tags_data if tags_data else None
                
                # Create RestaurantResponse with all fields maintained
                restaurant_response = RestaurantResponse.model_validate(restaurant_dict)
                restaurant_responses.append(restaurant_response)
            
            if restaurant_responses:  # Only add cities that have restaurants
                city_restaurants.append(CityRestaurantsResponse(
                    city=city,
                    restaurants=restaurant_responses
                ))
        
        return OptimizedFeaturedResponse(cities=city_restaurants)
    except Exception as e:
        logger.error(f"Error fetching featured optimized data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch featured data. Please try again later.")

@router.get("/{restaurant_id}/", response_model=RestaurantResponse)
def get_restaurant(
    restaurant_id: str, 
    db: Session = Depends(get_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurant"),
    include_video_details: Optional[bool] = Query(True, description="Include full video details (description, transcription, summary)")
):
    """Get a single restaurant by ID."""
    try:
        # Base query with tags
        query = db.query(Restaurant).options(joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag))
        
        # Add listings if requested
        if include_listings:
            query = query.options(
                joinedload(Restaurant.listings)
                .joinedload(Listing.video),
                joinedload(Restaurant.listings)
                .joinedload(Listing.influencer)
            )
        
        restaurant = query.filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()

        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Convert to response format
        restaurant_data = RestaurantResponse.model_validate(restaurant)
        
        if include_listings and restaurant.listings:
            listings_data = []
            for listing in restaurant.listings:
                if include_video_details:
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=listing.restaurant.id,
                        video=VideoResponse.model_validate(listing.video),
                        influencer=InfluencerResponse.model_validate(listing.influencer),
                        visit_date=listing.visit_date,
                        quotes=listing.quotes,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                else:
                    listing_response = ListingLightResponse(
                        id=listing.id,
                        restaurant=listing.restaurant.id,
                        video=listing.video.id,
                        influencer=InfluencerResponse.model_validate(listing.influencer),
                        visit_date=listing.visit_date,
                        quotes=listing.quotes,
                        created_at=listing.created_at,
                        updated_at=listing.updated_at
                    )
                listings_data.append(listing_response)
            restaurant_data.listings = listings_data
        
        return restaurant_data
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant {restaurant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant. Please try again later.")

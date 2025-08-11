from typing import List

from fastapi import APIRouter, Depends, HTTPException
import httpx
import os

from sqlalchemy.orm import Session, joinedload

from app.models import Restaurant, RestaurantTag
from app.database import get_db
from typing import List
from sqlalchemy import func
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.tags import TagResponse

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
GOOGLE_PLACES_API_BASE_URL = "https://places.googleapis.com/v1/"

async def get_google_place_photo_url(place_id: str):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured.")

    # Step 1: Get photo reference from Place Details (New) API
    place_details_url = f"{GOOGLE_PLACES_API_BASE_URL}places/{place_id}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "photos"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(place_details_url, headers=headers)
        response.raise_for_status()
        place_data = response.json()

    photos = place_data.get("photos")
    if not photos:
        return None

    # Assuming we want the first photo
    photo_resource_name = photos[0].get("name")
    if not photo_resource_name:
        return None

    # Step 2: Construct the photo URL using the photo resource name
    # We can specify max height/width here if needed, for now, let's use a reasonable default
    photo_url = f"{GOOGLE_PLACES_API_BASE_URL}{photo_resource_name}/media?key={GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400"
    return photo_url



router = APIRouter()

@router.get("/", response_model=List[RestaurantResponse])
def get_restaurants(
    db: Session = Depends(get_db),
    name: str | None = None,
    id: str | None = None,
    city: str | None = None,
    country: str | None = None,
    google_place_id: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """Get restaurants with filters for name, ID, city, country, or Google Place ID."""
    query = db.query(Restaurant).options(joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag)).filter(Restaurant.is_active == True)
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

    restaurants = query.offset(skip).limit(limit).all()

    # Convert to response objects and populate tags
    restaurant_responses = []
    for restaurant in restaurants:
        restaurant_dict = {
            "id": restaurant.id,
            "name": restaurant.name,
            "address": restaurant.address,
            "latitude": restaurant.latitude,
            "longitude": restaurant.longitude,
            "city": restaurant.city,
            "country": restaurant.country,
            "google_place_id": restaurant.google_place_id,
            "google_rating": restaurant.google_rating,
            "business_status": restaurant.business_status,
            "photo_url": restaurant.photo_url,
            "is_active": restaurant.is_active,
            "created_at": restaurant.created_at,
            "updated_at": restaurant.updated_at,
            "tags": [TagResponse.model_validate(rt.tag) for rt in restaurant.restaurant_tags] if restaurant.restaurant_tags else None
        }
        restaurant_responses.append(RestaurantResponse(**restaurant_dict))
    
    return restaurant_responses

@router.get("/popular_cities", response_model=List[str])
def get_popular_cities(db: Session = Depends(get_db)):
    """Get the top 5 cities with the most restaurant listings."""
    popular_cities = db.query(Restaurant.city).group_by(Restaurant.city).order_by(func.count(Restaurant.city).desc()).limit(5).all()
    return [city[0] for city in popular_cities]

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Get a single restaurant by ID."""
    restaurant = db.query(Restaurant).options(joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag)).filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()


    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Convert to response object and populate tags
    restaurant_dict = {
        "id": restaurant.id,
        "name": restaurant.name,
        "address": restaurant.address,
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude,
        "city": restaurant.city,
        "country": restaurant.country,
        "google_place_id": restaurant.google_place_id,
        "google_rating": restaurant.google_rating,
        "business_status": restaurant.business_status,
        "photo_url": restaurant.photo_url,
        "is_active": restaurant.is_active,
        "created_at": restaurant.created_at,
        "updated_at": restaurant.updated_at,
        "tags": [TagResponse.model_validate(rt.tag) for rt in restaurant.restaurant_tags] if restaurant.restaurant_tags else None
    }
    
    return RestaurantResponse(**restaurant_dict)

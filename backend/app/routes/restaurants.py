from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Restaurant, RestaurantTag
from app.database import get_db
from app.api_schema.tags import TagResponse
from app.api_schema.restaurants import RestaurantResponse

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
    try:
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
        return restaurants

    except Exception as e:
        print(f"Error fetching restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants. Please try again later.")

@router.get("/popular_cities/", response_model=List[str])
def get_popular_cities(db: Session = Depends(get_db)):
    """Get the top 5 cities with the most restaurant listings."""
    try:
        popular_cities = db.query(Restaurant.city).group_by(Restaurant.city).order_by(func.count(Restaurant.city).desc()).limit(5).all()
        return [city[0] for city in popular_cities]
    except Exception as e:
        # Log the error and return default cities if database query fails
        print(f"Error fetching popular cities: {e}")
        return []

@router.get("/{restaurant_id}/", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Get a single restaurant by ID."""
    try:
        restaurant = db.query(Restaurant).options(joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag)).filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()

        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return restaurant
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        print(f"Error fetching restaurant {restaurant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant. Please try again later.")

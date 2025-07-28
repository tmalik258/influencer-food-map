from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.models import Restaurant
from app.database import get_db
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
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    if name:
        query = query.filter(Restaurant.name.ilike(f"%{name}%"))
    if id:
        query = query.filter(Restaurant.id == id)
    if city:
        query = query.filter(Restaurant.city == city)
    if country:
        query = query.filter(Restaurant.country == country)
    if google_place_id:
        query = query.filter(Restaurant.google_place_id == google_place_id)
    restaurants = query.offset(skip).limit(limit).all()
    return restaurants

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Get a single restaurant by ID."""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant
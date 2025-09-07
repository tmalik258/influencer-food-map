from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Cuisine, Restaurant, RestaurantCuisine
from app.database import get_async_db
from app.api_schema.cuisines import CuisineResponse

router = APIRouter()

@router.get("/", response_model=List[CuisineResponse])
async def get_cuisines(
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    id: str | None = None,
    city: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """Get cuisines with filters for name or ID."""
    try:
        query = select(Cuisine)
        if name:
            query = query.filter(Cuisine.name.ilike(f"%{name}%"))
        if id:
            query = query.filter(Cuisine.id == id)
        if city:
            query = query.join(Cuisine.restaurant_cuisines).join(RestaurantCuisine.restaurant).filter(Restaurant.city.ilike(f"%{city}%"))
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        cuisines = result.scalars().all()
        return cuisines
    except Exception as e:
        print(f"Error fetching cuisines: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching cuisines")

@router.get("/{cuisine_id}/", response_model=CuisineResponse)
async def get_cuisine(cuisine_id: str, db: AsyncSession = Depends(get_async_db)):
    """Get a single cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        cuisine = result.scalar_one_or_none()
        if not cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")
        return cuisine
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching cuisine")
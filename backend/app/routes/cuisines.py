from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Cuisine, Restaurant, RestaurantCuisine
from app.database import get_async_db
from app.api_schema.cuisines import CuisineResponse, CuisineCreate, CuisineUpdate

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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while fetching cuisines")

@router.post("/", response_model=CuisineResponse, status_code=status.HTTP_201_CREATED)
async def create_cuisine(cuisine: CuisineCreate, db: AsyncSession = Depends(get_async_db)):
    """Create a new cuisine."""
    try:
        db_cuisine = Cuisine(name=cuisine.name)
        db.add(db_cuisine)
        await db.commit()
        await db.refresh(db_cuisine)
        return db_cuisine
    except Exception as e:
        print(f"Error creating cuisine: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while creating cuisine")

@router.put("/{cuisine_id}/", response_model=CuisineResponse)
async def update_cuisine(cuisine_id: UUID, cuisine: CuisineUpdate, db: AsyncSession = Depends(get_async_db)):
    """Update an existing cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        db_cuisine = result.scalar_one_or_none()
        if not db_cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
        db_cuisine.name = cuisine.name
        await db.commit()
        await db.refresh(db_cuisine)
        return db_cuisine
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while updating cuisine")

@router.delete("/{cuisine_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cuisine(cuisine_id: UUID, db: AsyncSession = Depends(get_async_db)):
    """Delete a cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        db_cuisine = result.scalar_one_or_none()
        if not db_cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
        await db.delete(db_cuisine)
        await db.commit()
        return
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while deleting cuisine")

@router.get("/{cuisine_id}/", response_model=CuisineResponse)
async def get_cuisine(cuisine_id: UUID, db: AsyncSession = Depends(get_async_db)):
    """Get a single cuisine by ID."""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        cuisine = result.scalar_one_or_none()
        if not cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuisine not found")
        return cuisine
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching cuisine {cuisine_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error while fetching cuisine")
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_schema.cuisines import CuisineCreate, CuisineUpdate, CuisineResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.cuisine import Cuisine

admin_cuisines_router = APIRouter()

@admin_cuisines_router.post(
    "/", response_model=CuisineResponse, status_code=status.HTTP_201_CREATED
)
async def create_cuisine(
    cuisine: CuisineCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new cuisine (Admin only)"""
    try:
        # Check if cuisine with same name already exists
        query = select(Cuisine).filter(Cuisine.name == cuisine.name)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()
        
        if existing_cuisine:
            raise HTTPException(
                status_code=400, 
                detail=f"Cuisine with name '{cuisine.name}' already exists"
            )
        
        new_cuisine = Cuisine(**cuisine.model_dump())
        db.add(new_cuisine)
        await db.commit()
        await db.refresh(new_cuisine)
        return new_cuisine
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create cuisine: {str(e)}"
        )

@admin_cuisines_router.put(
    "/{cuisine_id}", response_model=CuisineResponse
)
async def update_cuisine(
    cuisine_id: UUID,
    cuisine_update: CuisineUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing cuisine (Admin only)"""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()

        if not existing_cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")

        # Check if new name conflicts with existing cuisine
        if cuisine_update.name and cuisine_update.name != existing_cuisine.name:
            name_query = select(Cuisine).filter(Cuisine.name == cuisine_update.name)
            name_result = await db.execute(name_query)
            conflicting_cuisine = name_result.scalars().first()
            
            if conflicting_cuisine:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cuisine with name '{cuisine_update.name}' already exists"
                )

        for field, value in cuisine_update.model_dump(exclude_unset=True).items():
            setattr(existing_cuisine, field, value)

        await db.commit()
        await db.refresh(existing_cuisine)
        return existing_cuisine
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update cuisine: {str(e)}"
        )

@admin_cuisines_router.delete(
    "/{cuisine_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_cuisine(
    cuisine_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a cuisine (Admin only)"""
    try:
        query = select(Cuisine).filter(Cuisine.id == cuisine_id)
        result = await db.execute(query)
        existing_cuisine = result.scalars().first()

        if not existing_cuisine:
            raise HTTPException(status_code=404, detail="Cuisine not found")

        await db.execute(delete(Cuisine).filter(Cuisine.id == cuisine_id))
        await db.commit()
        
        return {"message": "Cuisine deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete cuisine: {str(e)}"
        )
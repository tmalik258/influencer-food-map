from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.models import Restaurant, RestaurantTag, RestaurantCuisine, Tag, Cuisine, Listing
from app.database import get_db, get_async_db
from app.dependencies import get_current_admin
from app.api_schema.restaurants import RestaurantResponse
from app.api_schema.admin_restaurants import (
    RestaurantCreate, 
    RestaurantUpdate, 
    RestaurantTagUpdate,
    RestaurantCuisineUpdate,
    RestaurantResponse as AdminRestaurantResponse
)

router = APIRouter()

@router.post("/", response_model=AdminRestaurantResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    restaurant: RestaurantCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new restaurant."""
    try:
        # Create new restaurant instance
        new_restaurant = Restaurant(
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
            is_active=restaurant.is_active
        )
        
        # Add to database
        db.add(new_restaurant)
        await db.commit()
        await db.refresh(new_restaurant)
        
        return AdminRestaurantResponse(
            message="Restaurant created successfully",
            restaurant_id=new_restaurant.id
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create restaurant: {str(e)}"
        )

@router.get("/", response_model=List[RestaurantResponse])
async def get_all_restaurants(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Get all restaurants with pagination."""
    try:
        # Build query with tags, cuisines, and listings with influencer and video
        query = select(Restaurant).options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Restaurant.listings).joinedload(Listing.influencer),
            joinedload(Restaurant.listings).joinedload(Listing.video)
        )
        
        # Filter active/inactive
        if not include_inactive:
            query = query.filter(Restaurant.is_active == True)
            
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        restaurants = result.scalars().all()
        
        return restaurants
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve restaurants: {str(e)}"
        )

@router.get("/{restaurant_id}/", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Get a single restaurant by ID."""
    try:
        # Load restaurant with tags, cuisines, and listings with influencer and video
        query = select(Restaurant).options(
            joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
            joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
            joinedload(Restaurant.listings).joinedload(Listing.influencer),
            joinedload(Restaurant.listings).joinedload(Listing.video)
        ).where(Restaurant.id == restaurant_id)
        
        # Execute query
        result = await db.execute(query)
        restaurant = result.scalars().first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve restaurant: {str(e)}"
        )

@router.put("/{restaurant_id}/", response_model=AdminRestaurantResponse)
async def update_restaurant(
    restaurant_id: UUID,
    restaurant_update: RestaurantUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing restaurant."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Update restaurant fields if provided
        update_data = restaurant_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_restaurant, field, value)
        
        # Commit changes
        await db.commit()
        await db.refresh(db_restaurant)
        
        return AdminRestaurantResponse(
            message="Restaurant updated successfully",
            restaurant_id=db_restaurant.id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant: {str(e)}"
        )

@router.delete("/{restaurant_id}/", response_model=AdminRestaurantResponse)
async def delete_restaurant(
    restaurant_id: UUID,
    permanent: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Delete a restaurant (soft delete by default)."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        if permanent:
            # Hard delete - remove from database
            await db.delete(db_restaurant)
            message = "Restaurant permanently deleted"
        else:
            # Soft delete - mark as inactive
            db_restaurant.is_active = False
            message = "Restaurant deactivated"
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message=message,
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete restaurant: {str(e)}"
        )

@router.put("/{restaurant_id}/tags/", response_model=AdminRestaurantResponse)
async def update_restaurant_tags(
    restaurant_id: UUID,
    tag_update: RestaurantTagUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update tags associated with a restaurant."""
    try:
        # Find the restaurant
        restaurant_query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        restaurant_result = await db.execute(restaurant_query)
        db_restaurant = restaurant_result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Verify all tags exist
        for tag_id in tag_update.tag_ids:
            tag_query = select(Tag).filter(Tag.id == tag_id)
            tag_result = await db.execute(tag_query)
            tag = tag_result.scalars().first()
            if not tag:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tag with ID {tag_id} not found"
                )
        
        # Remove existing tags
        delete_stmt = delete(RestaurantTag).where(RestaurantTag.restaurant_id == restaurant_id)
        await db.execute(delete_stmt)
        
        # Add new tags
        for tag_id in tag_update.tag_ids:
            restaurant_tag = RestaurantTag(restaurant_id=restaurant_id, tag_id=tag_id)
            db.add(restaurant_tag)
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant tags updated successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant tags: {str(e)}"
        )

@router.put("/{restaurant_id}/cuisines/", response_model=AdminRestaurantResponse)
async def update_restaurant_cuisines(
    restaurant_id: UUID,
    cuisine_update: RestaurantCuisineUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update cuisines associated with a restaurant."""
    try:
        # Find the restaurant
        restaurant_query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        restaurant_result = await db.execute(restaurant_query)
        db_restaurant = restaurant_result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Verify all cuisines exist
        for cuisine_id in cuisine_update.cuisine_ids:
            cuisine_query = select(Cuisine).filter(Cuisine.id == cuisine_id)
            cuisine_result = await db.execute(cuisine_query)
            cuisine = cuisine_result.scalars().first()
            if not cuisine:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cuisine with ID {cuisine_id} not found"
                )
        
        # Remove existing cuisines
        delete_stmt = delete(RestaurantCuisine).where(RestaurantCuisine.restaurant_id == restaurant_id)
        await db.execute(delete_stmt)
        
        # Add new cuisines
        for cuisine_id in cuisine_update.cuisine_ids:
            restaurant_cuisine = RestaurantCuisine(restaurant_id=restaurant_id, cuisine_id=cuisine_id)
            db.add(restaurant_cuisine)
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant cuisines updated successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update restaurant cuisines: {str(e)}"
        )

@router.put("/{restaurant_id}/restore/", response_model=AdminRestaurantResponse)
async def restore_restaurant(
    restaurant_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Restore a soft-deleted restaurant."""
    try:
        # Find the restaurant
        query = select(Restaurant).filter(Restaurant.id == restaurant_id)
        result = await db.execute(query)
        db_restaurant = result.scalars().first()
        
        if not db_restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Restore by marking as active
        db_restaurant.is_active = True
        
        # Commit changes
        await db.commit()
        
        return AdminRestaurantResponse(
            message="Restaurant restored successfully",
            restaurant_id=restaurant_id
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore restaurant: {str(e)}"
        )
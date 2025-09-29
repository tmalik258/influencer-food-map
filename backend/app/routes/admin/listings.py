from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_schema.listings import ListingCreate, ListingUpdate, ListingResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.listing import Listing
from app.models.restaurant import Restaurant
from app.models.video import Video

admin_listings_router = APIRouter()

@admin_listings_router.post(
    "/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED
)
async def create_listing(
    listing: ListingCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    # If visit_date is not provided, extract it from the video's published_at
    listing_data = listing.model_dump()
    
    if not listing_data.get("visit_date") and listing_data.get("video_id"):
        # Fetch the video to get the published_at date
        video_query = select(Video).filter(Video.id == listing_data["video_id"])
        video_result = await db.execute(video_query)
        video = video_result.scalars().first()
        
        if video and video.published_at:
            listing_data["visit_date"] = video.published_at.date()
    
    new_listing = Listing(**listing_data)
    db.add(new_listing)
    await db.commit()
    await db.refresh(new_listing)
    return new_listing

@admin_listings_router.put(
    "/{listing_id}/", response_model=ListingResponse
)
async def update_listing(
    listing_id: UUID,
    listing_update: ListingUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    query = select(Listing).filter(Listing.id == listing_id)
    result = await db.execute(query)
    existing_listing = result.scalars().first()

    if not existing_listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    for field, value in listing_update.model_dump(exclude_unset=True).items():
        setattr(existing_listing, field, value)

    await db.commit()
    await db.refresh(existing_listing)
    return existing_listing

@admin_listings_router.put("/approve-all/", response_model=dict)
async def approve_all_listings(
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    try:
        result = await db.execute(
            update(Listing).values(approved=True)
        )
        await db.commit()
        affected_rows = result.rowcount
        return {
            "message": f"Successfully approved {affected_rows} listings",
            "approved_count": affected_rows
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve all listings: {str(e)}")

@admin_listings_router.put("/approve/{listing_id}/", response_model=dict)
async def approve_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    try:
        query = select(Listing).filter(Listing.id == listing_id)
        result = await db.execute(query)
        listing = result.scalars().first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.approved = True
        await db.commit()
        await db.refresh(listing)
        
        return {
            "message": f"Successfully approved listing {listing_id}",
            "listing_id": listing_id,
            "approved": True
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve listing: {str(e)}")

@admin_listings_router.put("/disapprove/{listing_id}/", response_model=dict)
async def disapprove_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    try:
        query = select(Listing).filter(Listing.id == listing_id)
        result = await db.execute(query)
        listing = result.scalars().first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.approved = False
        await db.commit()
        await db.refresh(listing)
        
        return {
            "message": f"Successfully disapproved listing {listing_id}",
            "listing_id": listing_id,
            "approved": False
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to disapprove listing: {str(e)}")

@admin_listings_router.delete("/{listing_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: UUID,
    delete_restaurant: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    try:
        query = select(Listing).filter(Listing.id == listing_id)
        result = await db.execute(query)
        listing = result.scalars().first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        if delete_restaurant:
            restaurant_query = select(Restaurant).filter(Restaurant.id == listing.restaurant_id)
            restaurant_result = await db.execute(restaurant_query)
            restaurant = restaurant_result.scalars().first()
            if restaurant:
                await db.delete(restaurant)

        await db.delete(listing)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listing")

@admin_listings_router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_listings(
    delete_restaurants: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    try:
        await db.execute(delete(Listing))

        if delete_restaurants:
            await db.execute(delete(Restaurant))

        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Error deleting all listings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listings")

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api_schema.listings import ListingCreate, ListingUpdate, ListingResponse
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.listing import Listing
from app.models.restaurant import Restaurant
from app.models.video import Video
from app.models.influencer import Influencer
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

admin_listings_router = APIRouter()

@admin_listings_router.post(
    "/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED
)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    # If visit_date is not provided, extract it from the video's published_at
    try:
        listing_data = listing.model_dump()
        
        if not listing_data.get("visit_date") and listing_data.get("video_id"):
            # Fetch the video to get the published_at date
            video = db.query(Video).filter(Video.id == listing_data["video_id"]).first()
            
            if video and video.published_at:
                listing_data["visit_date"] = video.published_at.date()
        
        new_listing = Listing(**listing_data)
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)
        return new_listing
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        # Detect unique constraint violation for (video_id, restaurant_id, influencer_id)
        if (
            "duplicate key" in error_msg.lower() or "already exists" in error_msg.lower()
        ) and (
            "video_id" in error_msg and "restaurant_id" in error_msg and "influencer_id" in error_msg
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A listing for this influencer, video, and restaurant already exists"
            )
        
        logger.error(f"Database integrity error creating listing: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid listing data provided"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating listing: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while creating listing")

@admin_listings_router.put(
    "/{listing_id}/", response_model=ListingResponse
)
def update_listing(
    listing_id: UUID,
    listing_update: ListingUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        existing_listing = db.query(Listing).filter(Listing.id == listing_id).first()

        if not existing_listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        for field, value in listing_update.model_dump(exclude_unset=True).items():
            setattr(existing_listing, field, value)

        db.commit()
        db.refresh(existing_listing)
        return existing_listing
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        # Detect unique constraint violation for (video_id, restaurant_id, influencer_id)
        if (
            "duplicate key" in error_msg.lower() or "already exists" in error_msg.lower()
        ) and (
            "video_id" in error_msg and "restaurant_id" in error_msg and "influencer_id" in error_msg
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A listing for this influencer, video, and restaurant already exists"
            )
        
        logger.error(f"Database integrity error updating listing: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid listing data provided"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating listing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update listing: {str(e)}")

@admin_listings_router.put("/approve-all/", response_model=dict)
def approve_all_listings(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        result = db.query(Listing).update({Listing.approved: True})
        db.commit()
        return {
            "message": f"Successfully approved {result} listings",
            "approved_count": result
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error approving all listings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve all listings: {str(e)}")

@admin_listings_router.put("/approve/{listing_id}/", response_model=dict)
def approve_listing(
    listing_id: UUID,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.approved = True
        db.commit()
        db.refresh(listing)
        
        return {
            "message": f"Successfully approved listing {listing_id}",
            "listing_id": listing_id,
            "approved": True
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error approving listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve listing: {str(e)}")

@admin_listings_router.put("/disapprove/{listing_id}/", response_model=dict)
def disapprove_listing(
    listing_id: UUID,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.approved = False
        db.commit()
        db.refresh(listing)
        
        return {
            "message": f"Successfully disapproved listing {listing_id}",
            "listing_id": listing_id,
            "approved": False
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error disapproving listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to disapprove listing: {str(e)}")

@admin_listings_router.delete("/{listing_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: UUID,
    delete_restaurant: bool = False,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        if delete_restaurant:
            restaurant = db.query(Restaurant).filter(Restaurant.id == listing.restaurant_id).first()
            if restaurant:
                db.delete(restaurant)

        db.delete(listing)
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listing")

@admin_listings_router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_listings(
    delete_restaurants: bool = False,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        db.query(Listing).delete()

        if delete_restaurants:
            db.query(Restaurant).delete()

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting all listings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listings")

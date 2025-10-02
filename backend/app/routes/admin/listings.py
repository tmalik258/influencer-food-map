from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.api_schema.listings import ListingCreate, ListingUpdate, ListingResponse, PaginatedListingsResponse
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.listing import Listing
from app.models.restaurant import Restaurant
from app.models.video import Video
from app.models.influencer import Influencer
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

admin_listings_router = APIRouter(tags=["admin-listings"])

@admin_listings_router.get("/", response_model=PaginatedListingsResponse)
def get_admin_listings(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for restaurant, influencer, or video names"),
    status: Optional[str] = Query("all", description="Filter by status: all, approved, rejected, pending"),
    sort_by: Optional[str] = Query("created_at", description="Sort by: created_at, visit_date, confidence_score"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        # Build base query with joins
        query = db.query(Listing).options(
            joinedload(Listing.restaurant),
            joinedload(Listing.video),
            joinedload(Listing.influencer)
        )

        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.join(Restaurant).join(Video).join(Influencer).filter(
                or_(
                    Restaurant.name.ilike(search_term),
                    Influencer.name.ilike(search_term),
                    Video.title.ilike(search_term)
                )
            )

        # Apply status filter
        if status and status != "all":
            if status == "approved":
                query = query.filter(Listing.approved == True)
            elif status == "rejected":
                query = query.filter(Listing.approved == False)
            elif status == "pending":
                query = query.filter(Listing.approved.is_(None))

        # Apply sorting
        if sort_by == "created_at":
            sort_field = Listing.created_at
        elif sort_by == "visit_date":
            sort_field = Listing.visit_date
        elif sort_by == "confidence_score":
            sort_field = Listing.confidence_score
        else:
            sort_field = Listing.created_at

        if sort_order == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())

        # Get total count
        count_query = db.query(func.count(Listing.id))
        if search:
            count_query = count_query.join(Restaurant).join(Video).join(Influencer).filter(
                or_(
                    Restaurant.name.ilike(search_term),
                    Influencer.name.ilike(search_term),
                    Video.title.ilike(search_term)
                )
            )
        if status and status != "all":
            if status == "approved":
                count_query = count_query.filter(Listing.approved == True)
            elif status == "rejected":
                count_query = count_query.filter(Listing.approved == False)
            elif status == "pending":
                count_query = count_query.filter(Listing.approved.is_(None))

        total = count_query.scalar()

        # Apply pagination
        skip = (page - 1) * limit
        query = query.offset(skip).limit(limit)

        # Execute query
        listings = query.all()

        # Build response
        listings_response = []
        for listing in listings:
            # Build restaurant response
            restaurant_response = None
            if listing.restaurant:
                restaurant_response = {
                    "id": listing.restaurant.id,
                    "name": listing.restaurant.name,
                    "address": listing.restaurant.address,
                    "latitude": listing.restaurant.latitude,
                    "longitude": listing.restaurant.longitude,
                    "phone": listing.restaurant.phone,
                    "website": listing.restaurant.website,
                    "rating": listing.restaurant.rating,
                    "price_level": listing.restaurant.price_level,
                    "place_id": listing.restaurant.place_id,
                    "timestamp": listing.restaurant.timestamp,
                    "created_at": listing.restaurant.created_at,
                    "updated_at": listing.restaurant.updated_at
                }

            # Build video response
            video_response = None
            if listing.video:
                video_response = {
                    "id": listing.video.id,
                    "title": listing.video.title,
                    "description": listing.video.description,
                    "published_at": listing.video.published_at,
                    "channel_id": listing.video.channel_id,
                    "channel_title": listing.video.channel_title,
                    "view_count": listing.video.view_count,
                    "like_count": listing.video.like_count,
                    "duration": listing.video.duration,
                    "video_id": listing.video.video_id,
                    "thumbnail_url": listing.video.thumbnail_url,
                    "timestamp": listing.video.timestamp,
                    "created_at": listing.video.created_at,
                    "updated_at": listing.video.updated_at,
                    "influencer_id": listing.video.influencer_id,
                    "influencer": {
                        "id": listing.video.influencer.id if listing.video.influencer else None,
                        "name": listing.video.influencer.name if listing.video.influencer else None,
                        "channel_title": listing.video.influencer.channel_title if listing.video.influencer else None,
                        "subscriber_count": listing.video.influencer.subscriber_count if listing.video.influencer else None,
                        "video_count": listing.video.influencer.video_count if listing.video.influencer else None,
                        "view_count": listing.video.influencer.view_count if listing.video.influencer else None,
                        "created_at": listing.video.influencer.created_at if listing.video.influencer else None,
                        "updated_at": listing.video.influencer.updated_at if listing.video.influencer else None
                    } if listing.video.influencer else None
                }

            # Build influencer response
            influencer_response = None
            if listing.influencer:
                influencer_response = {
                    "id": listing.influencer.id,
                    "name": listing.influencer.name,
                    "channel_title": listing.influencer.channel_title,
                    "subscriber_count": listing.influencer.subscriber_count,
                    "video_count": listing.influencer.video_count,
                    "view_count": listing.influencer.view_count,
                    "created_at": listing.influencer.created_at,
                    "updated_at": listing.influencer.updated_at
                }

            listings_response.append({
                "id": listing.id,
                "restaurant": restaurant_response,
                "video": video_response,
                "influencer": influencer_response,
                "visit_date": listing.visit_date,
                "quotes": listing.quotes,
                "context": listing.context,
                "confidence_score": listing.confidence_score,
                "approved": listing.approved,
                "timestamp": listing.timestamp,
                "created_at": listing.created_at,
                "updated_at": listing.updated_at
            })

        total_pages = (total + limit - 1) // limit

        return PaginatedListingsResponse(
            listings=listings_response,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin listings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching listings")


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

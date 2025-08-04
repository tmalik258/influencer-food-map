from enum import Enum
from typing import List

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy.orm import (Session, joinedload)

from app.models import (Listing, Influencer, Restaurant)
from app.database import get_db
from app.dependencies import get_current_admin
from app.api_schema.listings import ListingResponse

router = APIRouter()

class ApprovedStatus(str, Enum):
    APPROVED = "Approved"
    NOT_APPROVED = "Not Approved"
    ALL = "All"

@router.get("/", response_model=List[ListingResponse])
def get_listings(
    db: Session = Depends(get_db),
    id: str | None = None,
    restaurant_id: str | None = None,
    video_id: str | None = None,
    influencer_id: str | None = None,
    influencer_name: str | None = None,
    approved_status: ApprovedStatus = ApprovedStatus.ALL,
    skip: int = 0,
    limit: int = 100
):
    """Get approved listings with filters for ID, restaurant ID, video ID, influencer ID, or influencer name."""
    query = db.query(Listing).options(
        joinedload(Listing.restaurant),
        joinedload(Listing.video),
        joinedload(Listing.influencer)
    )

    if approved_status == ApprovedStatus.APPROVED:
        query = query.filter(Listing.approved == True)
    elif approved_status == ApprovedStatus.NOT_APPROVED:
        query = query.filter(Listing.approved == False)
    # If approved_status is ApprovedStatus.ALL, no filter is applied

    if id:
        query = query.filter(Listing.id == id)
    if restaurant_id:
        query = query.filter(Listing.restaurant_id == restaurant_id)
    if video_id:
        query = query.filter(Listing.video_id == video_id)
    if influencer_id:
        query = query.filter(Listing.influencer_id == influencer_id)
    if influencer_name:
        query = query.join(Influencer).filter(Influencer.name.ilike(f"%{influencer_name}%"))

    listings = query.offset(skip).limit(limit).all()

    if not listings:
        raise HTTPException(status_code=404, detail="No listings found")

    return listings

@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    """Get a single approved listing by ID."""
    listing = db.query(Listing).options(
        joinedload(Listing.restaurant),
        joinedload(Listing.video),
        joinedload(Listing.influencer)
    ).filter(Listing.id == listing_id, Listing.approved == True).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    return listing

@router.delete("/{listing_id}")
def delete_listing(
    listing_id: str,
    delete_restaurant: bool = False,
    db: Session = Depends(get_db),
):
    """Delete a single listing by ID, with option to delete associated restaurant."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if delete_restaurant:
        restaurant = db.query(Restaurant).filter(Restaurant.id == listing.restaurant_id).first()
        if restaurant:
            db.delete(restaurant)

    db.delete(listing)
    db.commit()
    return {"detail": "Listing deleted successfully"}

@router.delete("/")
def delete_all_listings(
    delete_restaurants: bool = False,
    db: Session = Depends(get_db),
):
    """Delete all listings, with option to delete associated restaurants."""
    db.query(Listing).delete()

    if delete_restaurants:
        db.query(Restaurant).delete()

    db.commit()
    return {"detail": "All listings deleted successfully"}

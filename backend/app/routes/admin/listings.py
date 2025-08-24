from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import update

from app.models import Listing
from app.database import get_db
from app.api_schema.listings import ListingLightResponse

router = APIRouter()

@router.put("/approve-all")
def approve_all_listings(db: Session = Depends(get_db)):
    """Approve all listings in the database."""
    try:
        # Update all listings to approved=True
        result = db.execute(
            update(Listing).values(approved=True)
        )
        db.commit()
        
        affected_rows = result.rowcount
        
        return {
            "message": f"Successfully approved {affected_rows} listings",
            "approved_count": affected_rows
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve all listings: {str(e)}")

@router.put("/approve/{listing_id}")
def approve_listing(listing_id: str, db: Session = Depends(get_db)):
    """Approve a single listing by ID."""
    try:
        # Find the listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Update the listing to approved
        listing.approved = True
        db.commit()
        
        return {
            "message": f"Successfully approved listing {listing_id}",
            "listing_id": listing_id,
            "approved": True
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve listing: {str(e)}")

@router.put("/disapprove/{listing_id}")
def disapprove_listing(listing_id: str, db: Session = Depends(get_db)):
    """Disapprove a single listing by ID."""
    try:
        # Find the listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Update the listing to not approved
        listing.approved = False
        db.commit()
        
        return {
            "message": f"Successfully disapproved listing {listing_id}",
            "listing_id": listing_id,
            "approved": False
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to disapprove listing: {str(e)}")
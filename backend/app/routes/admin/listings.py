from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy import select, update, delete, desc
from sqlalchemy.orm import joinedload, Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Listing
from app.database import get_async_db, get_db
from app.dependencies import get_current_admin
from app.models.restaurant import Restaurant

router = APIRouter()

@router.put("/approve-all")
def approve_all_listings(db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
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
def approve_listing(listing_id: str, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
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
def disapprove_listing(listing_id: str, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
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


@router.delete("/{listing_id}/")
async def delete_listing(
    listing_id: str,
    delete_restaurant: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a single listing by ID, with option to delete associated restaurant."""
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
        return {"detail": "Listing deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listing")

@router.delete("/")
async def delete_all_listings(
    delete_restaurants: bool = False,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete all listings, with option to delete associated restaurants."""
    try:
        await db.execute(delete(Listing))

        if delete_restaurants:
            await db.execute(delete(Restaurant))

        await db.commit()
        return {"detail": "All listings deleted successfully"}
    except Exception as e:
        await db.rollback()
        print(f"Error deleting all listings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting listings")

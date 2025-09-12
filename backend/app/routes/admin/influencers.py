import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api_schema.influencers import InfluencerCreate, InfluencerUpdate, InfluencerResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.influencer import Influencer

# Configure logger
logger = logging.getLogger(__name__)

admin_influencers_router = APIRouter()

def sanitize_string(value: str) -> str:
    """Sanitize string input by stripping whitespace and limiting length"""
    if not value:
        return value
    return value.strip()[:1000]  # Limit to 1000 characters

@admin_influencers_router.post(
    "/", response_model=InfluencerResponse, status_code=status.HTTP_201_CREATED
)
async def create_influencer(
    influencer: InfluencerCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new influencer (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to create influencer: {influencer.name}")
    
    try:
        # Sanitize input data
        influencer_data = influencer.model_dump()
        if influencer_data.get('name'):
            influencer_data['name'] = sanitize_string(influencer_data['name'])
        if influencer_data.get('bio'):
            influencer_data['bio'] = sanitize_string(influencer_data['bio'])
        if influencer_data.get('youtube_channel_id'):
            influencer_data['youtube_channel_id'] = sanitize_string(influencer_data['youtube_channel_id'])
        if influencer_data.get('youtube_channel_name'):
            influencer_data['youtube_channel_name'] = sanitize_string(influencer_data['youtube_channel_name'])
        
        # Validate required fields
        if not influencer_data.get('name') or len(influencer_data['name'].strip()) == 0:
            logger.warning(f"Admin {current_admin.email} attempted to create influencer with empty name")
            raise HTTPException(
                status_code=400,
                detail="Influencer name is required and cannot be empty"
            )
        
        # Check if influencer with same YouTube channel ID already exists (if provided)
        if influencer_data.get('youtube_channel_id'):
            query = select(Influencer).filter(
                Influencer.youtube_channel_id == influencer_data['youtube_channel_id']
            )
            result = await db.execute(query)
            existing_influencer = result.scalars().first()
            
            if existing_influencer:
                logger.warning(
                    f"Admin {current_admin.email} attempted to create influencer with duplicate YouTube channel ID: {influencer_data['youtube_channel_id']}"
                )
                raise HTTPException(
                    status_code=400, 
                    detail=f"Influencer with YouTube channel ID '{influencer_data['youtube_channel_id']}' already exists"
                )
        
        # Create new influencer
        new_influencer = Influencer(**influencer_data)
        db.add(new_influencer)
        await db.commit()
        await db.refresh(new_influencer)
        
        logger.info(f"Admin {current_admin.email} successfully created influencer: {new_influencer.name} (ID: {new_influencer.id})")
        
        # Return response without listings to avoid circular dependencies
        return InfluencerResponse(
            id=new_influencer.id,
            name=new_influencer.name,
            bio=new_influencer.bio,
            avatar_url=new_influencer.avatar_url,
            banner_url=new_influencer.banner_url,
            youtube_channel_id=new_influencer.youtube_channel_id,
            youtube_channel_url=new_influencer.youtube_channel_url,
            subscriber_count=new_influencer.subscriber_count,
            created_at=new_influencer.created_at,
            updated_at=new_influencer.updated_at,
            listings=None
        )
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error while creating influencer: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Database constraint violation. Please check for duplicate values."
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error while creating influencer: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while creating influencer"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while creating influencer: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while creating influencer"
        )

@admin_influencers_router.put(
    "/{influencer_id}", response_model=InfluencerResponse
)
async def update_influencer(
    influencer_id: UUID,
    influencer_update: InfluencerUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing influencer (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to update influencer: {influencer_id}")
    
    try:
        # Get existing influencer
        query = select(Influencer).filter(Influencer.id == influencer_id)
        result = await db.execute(query)
        existing_influencer = result.scalars().first()
        
        if not existing_influencer:
            logger.warning(f"Admin {current_admin.email} attempted to update non-existent influencer: {influencer_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Influencer with ID {influencer_id} not found"
            )
        
        # Sanitize and validate update data
        update_data = influencer_update.model_dump(exclude_unset=True)
        
        # Sanitize string fields
        if "name" in update_data and update_data["name"]:
            update_data["name"] = sanitize_string(update_data["name"])
            if len(update_data["name"].strip()) == 0:
                logger.warning(f"Admin {current_admin.email} attempted to update influencer {influencer_id} with empty name")
                raise HTTPException(
                    status_code=400,
                    detail="Influencer name cannot be empty"
                )
        
        if "bio" in update_data and update_data["bio"]:
            update_data["bio"] = sanitize_string(update_data["bio"])
        
        if "youtube_channel_id" in update_data and update_data["youtube_channel_id"]:
            update_data["youtube_channel_id"] = sanitize_string(update_data["youtube_channel_id"])
        
        if "youtube_channel_name" in update_data and update_data["youtube_channel_name"]:
            update_data["youtube_channel_name"] = sanitize_string(update_data["youtube_channel_name"])
        
        # Validate subscriber count if provided
        if "subscriber_count" in update_data and update_data["subscriber_count"] is not None:
            if update_data["subscriber_count"] < 0:
                logger.warning(f"Admin {current_admin.email} attempted to set negative subscriber count for influencer {influencer_id}")
                raise HTTPException(
                    status_code=400,
                    detail="Subscriber count cannot be negative"
                )
        
        # Check if YouTube channel ID is being updated and if it conflicts
        if "youtube_channel_id" in update_data and update_data["youtube_channel_id"]:
            # Check if another influencer already has this YouTube channel ID
            conflict_query = select(Influencer).filter(
                Influencer.youtube_channel_id == update_data["youtube_channel_id"],
                Influencer.id != influencer_id
            )
            conflict_result = await db.execute(conflict_query)
            conflicting_influencer = conflict_result.scalars().first()
            
            if conflicting_influencer:
                logger.warning(
                    f"Admin {current_admin.email} attempted to update influencer {influencer_id} with duplicate YouTube channel ID: {update_data['youtube_channel_id']}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Another influencer already has YouTube channel ID '{update_data['youtube_channel_id']}'"
                )
        
        # Update fields
        for field, value in update_data.items():
            setattr(existing_influencer, field, value)
        
        await db.commit()
        await db.refresh(existing_influencer)
        
        logger.info(f"Admin {current_admin.email} successfully updated influencer: {existing_influencer.name} (ID: {influencer_id})")
        
        # Return response without listings to avoid circular dependencies
        return InfluencerResponse(
            id=existing_influencer.id,
            name=existing_influencer.name,
            bio=existing_influencer.bio,
            avatar_url=existing_influencer.avatar_url,
            banner_url=existing_influencer.banner_url,
            youtube_channel_id=existing_influencer.youtube_channel_id,
            youtube_channel_url=existing_influencer.youtube_channel_url,
            subscriber_count=existing_influencer.subscriber_count,
            created_at=existing_influencer.created_at,
            updated_at=existing_influencer.updated_at,
            listings=None
        )
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Database constraint violation. Please check for duplicate values."
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while updating influencer"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while updating influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while updating influencer"
        )

@admin_influencers_router.delete(
    "/{influencer_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_influencer(
    influencer_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete an influencer (Admin only)"""
    logger.info(f"Admin {current_admin.email} attempting to delete influencer: {influencer_id}")
    
    try:
        # Check if influencer exists
        query = select(Influencer).filter(Influencer.id == influencer_id)
        result = await db.execute(query)
        existing_influencer = result.scalars().first()
        
        if not existing_influencer:
            logger.warning(f"Admin {current_admin.email} attempted to delete non-existent influencer: {influencer_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Influencer with ID {influencer_id} not found"
            )
        
        # Log influencer details before deletion for audit purposes
        logger.info(f"Deleting influencer: {existing_influencer.name} (ID: {influencer_id}, YouTube: {existing_influencer.youtube_channel_id})")
        
        # Check if influencer has associated listings
        from app.models.listing import Listing
        listings_query = select(Listing).filter(Listing.influencer_id == influencer_id)
        listings_result = await db.execute(listings_query)
        associated_listings = listings_result.scalars().first()
        
        if associated_listings:
            logger.warning(f"Admin {current_admin.email} attempted to delete influencer {influencer_id} with associated listings")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete influencer with associated listings. Please remove listings first."
            )
        
        # Delete the influencer
        delete_query = delete(Influencer).filter(Influencer.id == influencer_id)
        delete_result = await db.execute(delete_query)
        
        # Check if deletion was successful
        if delete_result.rowcount == 0:
            logger.error(f"Failed to delete influencer {influencer_id} - no rows affected")
            raise HTTPException(
                status_code=500,
                detail="Failed to delete influencer - no rows were affected"
            )
        
        await db.commit()
        logger.info(f"Admin {current_admin.email} successfully deleted influencer: {existing_influencer.name} (ID: {influencer_id})")
        
        return None  # 204 No Content
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Cannot delete influencer due to existing references. Please remove associated data first."
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while deleting influencer"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while deleting influencer {influencer_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while deleting influencer"
        )
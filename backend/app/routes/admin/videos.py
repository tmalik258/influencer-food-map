from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.video import Video
from app.api_schema.videos import VideoResponse, VideoCreate, VideoUpdate

admin_videos_router = APIRouter()

@admin_videos_router.post(
    "/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED
)
async def create_video(
    video: VideoCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new video (Admin only)"""
    try:
        new_video = Video(**video.model_dump())
        db.add(new_video)
        await db.commit()
        await db.refresh(new_video)
        return new_video
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create video: {str(e)}"
        )

@admin_videos_router.put(
    "/{video_id}", response_model=VideoResponse
)
async def update_video(
    video_id: UUID,
    video_update: VideoUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing video (Admin only)"""
    try:
        query = select(Video).filter(Video.id == video_id)
        result = await db.execute(query)
        existing_video = result.scalars().first()
        
        if not existing_video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        for field, value in video_update.model_dump(exclude_unset=True).items():
            setattr(existing_video, field, value)
        
        await db.commit()
        await db.refresh(existing_video)
        return existing_video
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update video: {str(e)}"
        )

@admin_videos_router.delete(
    "/{video_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_video(
    video_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a video (Admin only)"""
    try:
        query = select(Video).filter(Video.id == video_id)
        result = await db.execute(query)
        existing_video = result.scalars().first()
        
        if not existing_video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        await db.execute(delete(Video).filter(Video.id == video_id))
        await db.commit()
        
        return {"message": "Video deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete video: {str(e)}"
        )
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_schema.tags import TagCreate, TagUpdate, TagResponse
from app.database import get_async_db
from app.dependencies import get_current_admin
from app.models.tag import Tag

admin_tags_router = APIRouter()

@admin_tags_router.post(
    "/", response_model=TagResponse, status_code=status.HTTP_201_CREATED
)
async def create_tag(
    tag: TagCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Create a new tag (Admin only)"""
    try:
        # Check if tag with same name already exists
        query = select(Tag).filter(Tag.name == tag.name)
        result = await db.execute(query)
        existing_tag = result.scalars().first()
        
        if existing_tag:
            raise HTTPException(
                status_code=400, 
                detail=f"Tag with name '{tag.name}' already exists"
            )
        
        new_tag = Tag(**tag.model_dump())
        db.add(new_tag)
        await db.commit()
        await db.refresh(new_tag)
        return new_tag
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create tag: {str(e)}"
        )

@admin_tags_router.put(
    "/{tag_id}", response_model=TagResponse
)
async def update_tag(
    tag_id: UUID,
    tag_update: TagUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Update an existing tag (Admin only)"""
    try:
        query = select(Tag).filter(Tag.id == tag_id)
        result = await db.execute(query)
        existing_tag = result.scalars().first()

        if not existing_tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Check if new name conflicts with existing tag
        if tag_update.name and tag_update.name != existing_tag.name:
            name_query = select(Tag).filter(Tag.name == tag_update.name)
            name_result = await db.execute(name_query)
            conflicting_tag = name_result.scalars().first()
            
            if conflicting_tag:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag with name '{tag_update.name}' already exists"
                )

        for field, value in tag_update.model_dump(exclude_unset=True).items():
            setattr(existing_tag, field, value)

        await db.commit()
        await db.refresh(existing_tag)
        return existing_tag
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update tag: {str(e)}"
        )

@admin_tags_router.delete(
    "/{tag_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Delete a tag (Admin only)"""
    try:
        query = select(Tag).filter(Tag.id == tag_id)
        result = await db.execute(query)
        existing_tag = result.scalars().first()

        if not existing_tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        await db.execute(delete(Tag).filter(Tag.id == tag_id))
        await db.commit()
        
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete tag: {str(e)}"
        )
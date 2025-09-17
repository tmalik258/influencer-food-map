from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Tag, Restaurant, RestaurantTag
from app.database import get_async_db
from app.api_schema.tags import TagResponse, TagCreate, TagUpdate

router = APIRouter()

@router.post(
    "/", response_model=TagResponse, status_code=status.HTTP_201_CREATED
)
async def create_tag(tag: TagCreate, db: AsyncSession = Depends(get_async_db)):
    db_tag = Tag(**tag.model_dump())
    db.add(db_tag)
    await db.commit()
    await db.refresh(db_tag)
    return db_tag


@router.get("/", response_model=List[TagResponse])
async def get_tags(
    db: AsyncSession = Depends(get_async_db),
    name: str | None = None,
    city: str | None = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get tags with filters for name or ID."""
    try:
        query = select(Tag)
        if name:
            query = query.filter(Tag.name.ilike(f"%{name}%"))
        if city:
            query = query.join(Tag.restaurant_tags).join(RestaurantTag.restaurant).filter(Restaurant.city.ilike(f"%{city}%"))
        result = await db.execute(query.offset(skip).limit(limit))
        tags = result.scalars().all()
        return tags
    except Exception as e:
        print(f"Error fetching tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching tags")


@router.get("/{tag_id}/", response_model=TagResponse)
async def get_tag(tag_id: UUID, db: AsyncSession = Depends(get_async_db)):
    """Get a single tag by ID."""
    try:
        result = await db.execute(select(Tag).filter(Tag.id == tag_id))
        tag = result.scalars().first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return tag
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching tag {tag_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching tag")


@router.put("/{tag_id}/", response_model=TagResponse)
async def update_tag(tag_id: UUID, tag: TagUpdate, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Tag).filter(Tag.id == tag_id))
    db_tag = result.scalars().first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    for key, value in tag.model_dump(exclude_unset=True).items():
        setattr(db_tag, key, value)
    await db.commit()
    await db.refresh(db_tag)
    return db_tag


@router.delete("/{tag_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: UUID, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Tag).filter(Tag.id == tag_id))
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted successfully"}
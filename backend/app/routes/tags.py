from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.models import Tag
from app.database import get_db
from app.api_schema.tags import TagResponse

router = APIRouter()

@router.get("/", response_model=List[TagResponse])
def get_tags(
    db: Session = Depends(get_db),
    name: str | None = None,
    id: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """Get tags with filters for name or ID."""
    try:
        query = db.query(Tag)
        if name:
            query = query.filter(Tag.name.ilike(f"%{name}%"))
        if id:
            query = query.filter(Tag.id == id)
        tags = query.offset(skip).limit(limit).all()
        return tags
    except Exception as e:
        print(f"Error fetching tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching tags")

@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: str, db: Session = Depends(get_db)):
    """Get a single tag by ID."""
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return tag
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching tag {tag_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching tag")
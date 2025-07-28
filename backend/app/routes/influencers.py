from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.models import Influencer
from app.database import get_db
from app.api_schema.influencers import InfluencerResponse

router = APIRouter()

@router.get("/", response_model=List[InfluencerResponse])
def get_influencers(
    db: Session = Depends(get_db),
    name: str | None = None,
    id: str | None = None,
    youtube_channel_id: str | None = None,
    youtube_channel_url: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """Get influencers with filters for name, ID, YouTube channel ID, or URL."""
    query = db.query(Influencer)
    if name:
        query = query.filter(Influencer.name.ilike(f"%{name}%"))
    if id:
        query = query.filter(Influencer.id == id)
    if youtube_channel_id:
        query = query.filter(Influencer.youtube_channel_id == youtube_channel_id)
    if youtube_channel_url:
        query = query.filter(Influencer.youtube_channel_url == youtube_channel_url)
    influencers = query.offset(skip).limit(limit).all()
    return influencers

@router.get("/{influencer_id}", response_model=InfluencerResponse)
def get_influencer(influencer_id: str, db: Session = Depends(get_db)):
    """Get a single influencer by ID."""
    influencer = db.query(Influencer).filter(Influencer.id == influencer_id).first()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return influencer
from typing import List, Optional

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy.orm import Session

from app.models import (Video, Influencer, Listing)
from app.database import get_db
from app.api_schema.videos import VideoResponse

router = APIRouter()

@router.get("/", response_model=List[VideoResponse])
def get_videos(
    db: Session = Depends(get_db),
    title: Optional[str] = None,
    youtube_video_id: Optional[str] = None,
    video_url: Optional[str] = None,
    influencer_id: Optional[str] = None,
    influencer_name: Optional[str] = None,
    has_listings: bool = False,
    skip: int = 0,
    limit: int = 100
):
    """Get videos with filters for title, YouTube video ID, video URL, influencer ID, or influencer name."""
    query = db.query(Video)

    if has_listings:
        query = query.join(Listing).filter(Listing.video_id == Video.id)

    if title:
        query = query.filter(Video.title.ilike(f"%{title}%"))
    if youtube_video_id:
        query = query.filter(Video.youtube_video_id == youtube_video_id)
    if video_url:
        query = query.filter(Video.video_url == video_url)
    if influencer_id:
        query = query.filter(Video.influencer_id == influencer_id)
    if influencer_name:
        query = query.join(Influencer).filter(Influencer.name.ilike(f"%{influencer_name}%"))

    videos = query.offset(skip).limit(limit).all()

    if not videos:
        raise HTTPException(status_code=404, detail="No videos found")

    return videos

@router.get("/{video_id}", response_model=VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db)):
    """Get a single video by ID."""
    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return video

from typing import List, Optional

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy.orm import Session, joinedload

from app.models import (Video, Influencer, Listing)
from app.database import get_db
from app.api_schema.videos import VideoResponse
from app.api_schema.influencers import InfluencerLightResponse

router = APIRouter()

@router.get("/", response_model=List[VideoResponse])
def get_videos(
    db: Session = Depends(get_db),
    title: Optional[str] = None,
    youtube_video_id: Optional[str] = None,
    video_title: Optional[str] = None,
    video_url: Optional[str] = None,
    influencer_id: Optional[str] = None,
    influencer_name: Optional[str] = None,
    has_listings: bool = False,
    skip: int = 0,
    limit: int = 100
):
    """Get videos with filters for title, YouTube video ID, video URL, video title, influencer ID, or influencer name."""
    try:
        query = db.query(Video).options(joinedload(Video.influencer))

        if has_listings:
            query = query.join(Listing).filter(Listing.video_id == Video.id)

        if title:
            query = query.filter(Video.title.ilike(f"%{title}%"))
        if youtube_video_id:
            query = query.filter(Video.youtube_video_id == youtube_video_id)
        if video_url:
            query = query.filter(Video.video_url == video_url)
        if video_title:
            query = query.filter(Video.title.ilike(f"%{video_title}%"))
        if influencer_id:
            query = query.filter(Video.influencer_id == influencer_id)
        if influencer_name:
            query = query.join(Influencer).filter(Influencer.name.ilike(f"%{influencer_name}%"))

        videos = query.offset(skip).limit(limit).all()

        if not videos:
            raise HTTPException(status_code=404, detail="No videos found")

        # Manually construct VideoResponse objects with influencer data
        video_responses = []
        for video in videos:
            influencer_response = None
            if video.influencer:
                influencer_response = InfluencerLightResponse(
                    id=video.influencer.id,
                    name=video.influencer.name,
                    bio=video.influencer.bio,
                    avatar_url=video.influencer.avatar_url,
                    banner_url=video.influencer.banner_url,
                    youtube_channel_id=video.influencer.youtube_channel_id,
                    youtube_channel_url=video.influencer.youtube_channel_url,
                    subscriber_count=video.influencer.subscriber_count,
                    created_at=video.influencer.created_at,
                    updated_at=video.influencer.updated_at
                )
            
            video_response = VideoResponse(
                id=video.id,
                influencer=influencer_response,
                youtube_video_id=video.youtube_video_id,
                title=video.title,
                description=video.description,
                video_url=video.video_url,
                published_at=video.published_at,
                transcription=video.transcription,
                created_at=video.created_at,
                updated_at=video.updated_at
            )
            video_responses.append(video_response)

        return video_responses
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching videos")

@router.get("/{video_id}/", response_model=VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db)):
    """Get a single video by ID."""
    try:
        video = db.query(Video).options(joinedload(Video.influencer)).filter(Video.id == video_id).first()

        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Manually construct VideoResponse with influencer data
        influencer_response = None
        if video.influencer:
            influencer_response = InfluencerLightResponse(
                id=video.influencer.id,
                name=video.influencer.name,
                bio=video.influencer.bio,
                avatar_url=video.influencer.avatar_url,
                banner_url=video.influencer.banner_url,
                youtube_channel_id=video.influencer.youtube_channel_id,
                youtube_channel_url=video.influencer.youtube_channel_url,
                subscriber_count=video.influencer.subscriber_count,
                created_at=video.influencer.created_at,
                updated_at=video.influencer.updated_at
            )
        
        video_response = VideoResponse(
            id=video.id,
            influencer=influencer_response,
            youtube_video_id=video.youtube_video_id,
            title=video.title,
            description=video.description,
            video_url=video.video_url,
            published_at=video.published_at,
            transcription=video.transcription,
            created_at=video.created_at,
            updated_at=video.updated_at
        )

        return video_response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching video {video_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching video")

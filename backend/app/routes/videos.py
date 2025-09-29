from typing import List, Optional

from fastapi import (APIRouter, Depends, HTTPException)
from pydantic import BaseModel

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models import (Video, Influencer, Listing)
from app.database import get_db
from app.api_schema.videos import VideoResponse, VideosResponse
from app.api_schema.influencers import InfluencerLightResponse

router = APIRouter()

@router.get("/", response_model=VideosResponse)
def get_videos(
    db: Session = Depends(get_db),
    title: Optional[str] = None,
    youtube_video_id: Optional[str] = None,
    video_title: Optional[str] = None,
    video_url: Optional[str] = None,
    influencer_id: Optional[str] = None,
    influencer_name: Optional[str] = None,
    has_listings: Optional[bool] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    skip: int = 0,
    limit: int = 100
):
    """Get videos with filters for title, YouTube video ID, video URL, video title, influencer ID, or influencer name."""
    try:
        # Start with a base query that includes the count of listings
        query = db.query(Video, func.count(Listing.id).label("listings_count")) \
            .outerjoin(Listing, Video.id == Listing.video_id) \
            .group_by(Video.id)

        # Handle has_listings filter with three options: True, False, or None (all)
        if has_listings is True:
            # Filter videos WITH listings
            query = query.having(func.count(Listing.id) > 0)
        elif has_listings is False:
            # Filter videos WITHOUT listings
            query = query.having(func.count(Listing.id) == 0)

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

        # Apply sorting
        if sort_by:
            # Map sort_by to the appropriate column
            sort_column = None
            if sort_by == "created_at":
                sort_column = Video.created_at
            elif sort_by == "published_at":
                sort_column = Video.published_at
            elif sort_by == "title":
                sort_column = Video.title
            
            if sort_column:
                if sort_order and sort_order.lower() == "asc":
                    query = query.order_by(sort_column.asc())
                else:
                    query = query.order_by(sort_column.desc())

        # Get total count before applying pagination
        total_count = query.count()

        # Apply pagination
        query = query.offset(skip).limit(limit)

        videos_with_counts = query.all()

        # Eager load influencers separately to avoid GROUP BY issues
        video_ids = [video.id for video, _ in videos_with_counts]
        influencers_map = {}
        if video_ids:
            influencers_query = db.query(Video).filter(Video.id.in_(video_ids)).options(joinedload(Video.influencer))
            for video in influencers_query:
                influencers_map[video.id] = video.influencer

        video_responses = []
        for video, listings_count in videos_with_counts:
            influencer_response = None
            influencer = influencers_map.get(video.id)
            if influencer:
                influencer_response = InfluencerLightResponse(
                    id=influencer.id,
                    name=influencer.name,
                    bio=influencer.bio,
                    avatar_url=influencer.avatar_url,
                    banner_url=influencer.banner_url,
                    youtube_channel_id=influencer.youtube_channel_id,
                    youtube_channel_url=influencer.youtube_channel_url,
                    subscriber_count=influencer.subscriber_count,
                    created_at=influencer.created_at,
                    updated_at=influencer.updated_at
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
                updated_at=video.updated_at,
                listings_count=listings_count
            )
            video_responses.append(video_response)

        return VideosResponse(videos=video_responses, total=total_count)
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
        
        # Calculate listings_count for a single video
        listings_count = db.query(func.count(Listing.id)).filter(Listing.video_id == video.id).scalar()

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
            updated_at=video.updated_at,
            listings_count=listings_count
        )

        return video_response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching video {video_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching video")

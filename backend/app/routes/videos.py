from typing import Optional

from fastapi import (APIRouter, Depends, HTTPException)

from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (Video, Influencer, Listing)
from app.models.video import VideoProcessingStatus
from app.database import get_async_db
from app.utils.logging import setup_logger
from app.api_schema.videos import VideoResponse, VideosResponse
from app.api_schema.influencers import InfluencerLightResponse

router = APIRouter()

logger = setup_logger(__name__)

@router.get("/", response_model=VideosResponse)
async def get_videos(
    db: AsyncSession = Depends(get_async_db),
    title: Optional[str] = None,
    youtube_video_id: Optional[str] = None,
    video_title: Optional[str] = None,
    video_url: Optional[str] = None,
    influencer_id: Optional[str] = None,
    influencer_name: Optional[str] = None,
    has_listings: Optional[bool] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    skip: int = 0,
    limit: int = 100
):
    """Get videos with filters for title, YouTube video ID, video URL, video title, influencer ID, or influencer name."""
    try:
        # Start with a base query that includes the count of listings
        stmt = select(Video, func.count(Listing.id).label("listings_count")) \
            .outerjoin(Listing, Video.id == Listing.video_id) \
            .group_by(Video.id)

        # Handle has_listings filter with three options: True, False, or None (all)
        if has_listings is True:
            # Filter videos WITH listings
            stmt = stmt.having(func.count(Listing.id) > 0)
        elif has_listings is False:
            # Filter videos WITHOUT listings
            stmt = stmt.having(func.count(Listing.id) == 0)

        if status == "completed":
            stmt = stmt.where(Video.status == VideoProcessingStatus.COMPLETED)
        elif status == "pending":
            stmt = stmt.where(Video.status == VideoProcessingStatus.PENDING)
        elif status == "failed":
            stmt = stmt.where(Video.status == VideoProcessingStatus.FAILED)

        if title:
            stmt = stmt.where(Video.title.ilike(f"%{title}%"))
        if youtube_video_id:
            stmt = stmt.where(Video.youtube_video_id == youtube_video_id)
        if video_url:
            stmt = stmt.where(Video.video_url == video_url)
        if video_title:
            stmt = stmt.where(Video.title.ilike(f"%{video_title}%"))
        if influencer_id:
            stmt = stmt.where(Video.influencer_id == influencer_id)
        if influencer_name:
            stmt = stmt.join(Influencer).where(Influencer.name.ilike(f"%{influencer_name}%"))

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
                    stmt = stmt.order_by(sort_column.asc())
                else:
                    stmt = stmt.order_by(sort_column.desc())

        # Get total count before applying pagination
        subq = stmt.subquery()
        count_stmt = select(func.count()).select_from(subq)
        count_result = await db.execute(count_stmt)
        total_count = count_result.scalar()

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)

        result = await db.execute(stmt)
        videos_with_counts = result.all()

        # Eager load influencers separately to avoid GROUP BY issues
        video_ids = [row[0].id for row in videos_with_counts]
        influencers_map = {}
        if video_ids:
            inf_stmt = select(Video).where(Video.id.in_(video_ids)).options(joinedload(Video.influencer))
            inf_result = await db.execute(inf_stmt)
            videos_inf = inf_result.scalars().all()
            for video in videos_inf:
                influencers_map[video.id] = video.influencer

        video_responses = []
        for row in videos_with_counts:
            video, listings_count = row
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
                status=video.status,
                error_message=video.error_message,
                created_at=video.created_at,
                updated_at=video.updated_at,
                listings_count=listings_count
            )
            video_responses.append(video_response)

        return VideosResponse(videos=video_responses, total=total_count)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching videos")

@router.get("/{video_id}/", response_model=VideoResponse)
async def get_video(video_id: str, db: AsyncSession = Depends(get_async_db)):
    """Get a single video by ID."""
    try:
        stmt = select(Video).options(joinedload(Video.influencer)).where(Video.id == video_id)
        result = await db.execute(stmt)
        video = result.scalar_one_or_none()

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
        count_stmt = select(func.count(Listing.id)).where(Listing.video_id == video.id)
        count_result = await db.execute(count_stmt)
        listings_count = count_result.scalar()

        video_response = VideoResponse(
            id=video.id,
            influencer=influencer_response,
            youtube_video_id=video.youtube_video_id,
            title=video.title,
            description=video.description,
            video_url=video.video_url,
            published_at=video.published_at,
            transcription=video.transcription,
            status=video.status,
            error_message=video.error_message,
            created_at=video.created_at,
            updated_at=video.updated_at,
            listings_count=listings_count
        )

        return video_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video {video_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching video")
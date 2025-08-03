import uuid

from sqlalchemy import (Column, String, Text, DateTime, ForeignKey, UniqueConstraint)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False)
    youtube_video_id = Column(String(100), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text) # Raw description from YouTube
    video_url = Column(String(255), nullable=False)
    published_at = Column(DateTime(timezone=True))
    transcription = Column(Text) # From Whisper
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    listings = relationship("Listing", back_populates="video")
    influencer = relationship("Influencer", back_populates="videos")

    __table_args__ = (
        UniqueConstraint('influencer_id', 'youtube_video_id', name='uix_influencer_youtube_video_id'),
    )

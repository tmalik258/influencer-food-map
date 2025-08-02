import uuid

from sqlalchemy import (Column, UUID, ForeignKey, Text, Date, Boolean, Float, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY

from app.database import Base

class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"))
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"))
    influencer_id = Column(UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), index=True)
    visit_date = Column(Date, nullable=True)  # Date of the influencer's visit, derived from video's published_at
    quotes = Column(ARRAY(Text)) # Quotes from the video
    confidence_score = Column(Float)
    approved = Column(Boolean, default=False) # Whether the listing is approved by the admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    video = relationship("Video", back_populates="listings")
    restaurant = relationship("Restaurant", back_populates="listings")
    influencer = relationship("Influencer", back_populates="listings")

import uuid

from sqlalchemy import (Column, String, Text, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    bio = Column(Text)
    avatar_url = Column(String(255), nullable=True)
    region = Column(String(100))
    youtube_channel_id = Column(String(100), nullable=False, unique=True)
    youtube_channel_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    videos = relationship("Video", back_populates="influencer")
    listings = relationship("Listing", back_populates="influencer")

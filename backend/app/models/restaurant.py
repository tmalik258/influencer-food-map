import uuid

from sqlalchemy import (Column, String, Text, Float, Boolean, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    branch_name = Column(String(255), nullable=True) # Optional branch name
    address = Column(Text, nullable=False) # Raw address from Google Places
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100), index=True)
    country = Column(String(100), index=True)
    google_place_id = Column(String(255), unique=True) # From Google Places API
    google_rating = Column(Float) # From Google Map API
    live_status = Column(Boolean, default=True) # Whether the restaurant is currently operational
    is_active = Column(Boolean, default=True) # Soft delete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    listings = relationship("Listing", back_populates="restaurant")
    restaurant_tags = relationship("RestaurantTag", back_populates="restaurant")

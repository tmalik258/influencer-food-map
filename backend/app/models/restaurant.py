import uuid
from enum import Enum

from sqlalchemy import (Column, String, Text, Float, Boolean, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from app.database import Base

class BusinessStatus(str, Enum):
    BUSINESS_STATUS_UNSPECIFIED = "BUSINESS_STATUS_UNSPECIFIED"
    OPERATIONAL = "OPERATIONAL"
    CLOSED_TEMPORARILY = "CLOSED_TEMPORARILY"
    CLOSED_PERMANENTLY = "CLOSED_PERMANENTLY"

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    address = Column(Text, nullable=False) # Raw address from Google Places
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100), index=True)
    country = Column(String(100), index=True)
    google_place_id = Column(String(255), unique=True) # From Google Places API
    google_rating = Column(Float) # From Google Map API
    business_status = Column(
        String(50),
        default=BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value,
        server_default=BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value,
        nullable=False
    ) # Whether the restaurant is currently operational
    photo_url = Column(Text, nullable=True) # From Google Places API
    is_active = Column(Boolean, default=True) # Soft delete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    listings = relationship("Listing", back_populates="restaurant")
    restaurant_tags = relationship("RestaurantTag", back_populates="restaurant")
    restaurant_cuisines = relationship("RestaurantCuisine", back_populates="restaurant")
    
    @hybrid_property
    def tags(self):
        """Return the actual Tag objects for serialization"""
        return [rt.tag for rt in self.restaurant_tags] if self.restaurant_tags else []
    
    @hybrid_property
    def cuisines(self):
        """Return the actual Cuisine objects for serialization"""
        return [rc.cuisine for rc in self.restaurant_cuisines] if self.restaurant_cuisines else []

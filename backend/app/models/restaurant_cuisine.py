from sqlalchemy import (Column, ForeignKey, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class RestaurantCuisine(Base):
    __tablename__ = "restaurant_cuisines"

    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True)
    cuisine_id = Column(UUID(as_uuid=True), ForeignKey("cuisines.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="restaurant_cuisines")
    cuisine = relationship("Cuisine", back_populates="restaurant_cuisines")
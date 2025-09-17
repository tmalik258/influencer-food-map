import uuid

from sqlalchemy import (Column, String, DateTime)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class Cuisine(Base):
    __tablename__ = "cuisines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurant_cuisines = relationship("RestaurantCuisine", back_populates="cuisine")
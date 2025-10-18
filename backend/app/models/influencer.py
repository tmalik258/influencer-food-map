import uuid

from sqlalchemy import (Column, String, Text, DateTime, Integer, event, inspect)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from slugify import slugify
from app.utils.slug_utils import ensure_unique_slug

from app.database import Base

class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    bio = Column(Text)
    avatar_url = Column(String(255), nullable=True)
    banner_url = Column(String(255), nullable=True)
    """
    Influencer's region/country, commented for now as we dont need it
    """
    # region = Column(String(100)) # 2 to 3 character country code
    # country = Column(String(255), nullable=True)
    youtube_channel_id = Column(String(100), nullable=False, unique=True)
    youtube_channel_url = Column(String(255))
    subscriber_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    videos = relationship("Video", back_populates="influencer")
    listings = relationship("Listing", back_populates="influencer")


@event.listens_for(Influencer, "before_insert")
def _influencer_before_insert(mapper, connection, target):
    base_slug = slugify(target.name or "")
    target.slug = ensure_unique_slug(
        connection,
        target.__table__,
        slug_column="slug",
        base_value=base_slug,
        id_column="id",
        current_id=None,
    )


@event.listens_for(Influencer, "before_update")
def _influencer_before_update(mapper, connection, target):
    state = inspect(target)
    name_changed = False
    try:
        name_changed = state.attrs.name.history.has_changes()
    except Exception:
        name_changed = True
    if name_changed or not getattr(target, "slug", None):
        base_slug = slugify(target.name or "")
        target.slug = ensure_unique_slug(
            connection,
            target.__table__,
            slug_column="slug",
            base_value=base_slug,
            id_column="id",
            current_id=target.id,
        )

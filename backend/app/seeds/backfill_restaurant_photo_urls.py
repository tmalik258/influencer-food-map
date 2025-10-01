import asyncio
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.restaurant import Restaurant
from app.services.google_places_service import resolve_google_photo_url
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

async def backfill_photos():
    logger.info("Starting photo URL backfill...")
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        restaurants = db.query(Restaurant).filter(
            Restaurant.google_place_id.isnot(None)
        ).all()
        updated = 0
        for r in restaurants:
            # Skip if already looks like final lh3 URL
            if r.photo_url and "lh3.googleusercontent.com" in r.photo_url:
                continue
            logger.info(f"Processing {r.name} ({r.google_place_id})")
            # Resolve via place details when needed
            # We don't have photo_reference stored; attempt to resolve via existing URL if any
            photo_reference: Optional[str] = None
            if r.photo_url and "photoreference=" in r.photo_url:
                try:
                    import urllib.parse as up
                    qs = up.urlparse(r.photo_url).query
                    params = dict(up.parse_qsl(qs))
                    photo_reference = params.get("photoreference")
                except Exception:
                    photo_reference = None
            if photo_reference:
                final_url = await resolve_google_photo_url(photo_reference)
                if final_url and final_url != r.photo_url:
                    r.photo_url = final_url
                    updated += 1
            await asyncio.sleep(0.05)
        db.commit()
        logger.info(f"Backfill complete. Updated {updated} records out of {len(restaurants)}.")
    except Exception as e:
        db.rollback()
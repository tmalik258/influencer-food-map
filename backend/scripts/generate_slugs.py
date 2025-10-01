import asyncio
import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_async_db
from app.models import Restaurant, Influencer

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove special characters except alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug or 'unnamed'

async def generate_unique_slug(session: AsyncSession, name: str, model, existing_slug: Optional[str] = None) -> str:
    """Generate unique slug, handling duplicates"""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    while True:
        # Check if slug exists (excluding current record if updating)
        query = select(model).filter(model.slug == slug)
        if existing_slug:
            query = query.filter(model.slug != existing_slug)
        
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            break
            
        # If duplicate exists, append counter
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

async def migrate_restaurants():
    """Generate slugs for existing restaurants"""
    async with get_async_db() as session:
        # Get all restaurants without slugs
        result = await session.execute(select(Restaurant))
        restaurants = result.scalars().all()
        
        for restaurant in restaurants:
            if not restaurant.slug:
                restaurant.slug = await generate_unique_slug(
                    session, restaurant.name, Restaurant
                )
        
        await session.commit()
        print(f"Migrated {len(restaurants)} restaurants")

async def migrate_influencers():
    """Generate slugs for existing influencers"""
    async with get_async_db() as session:
        # Get all influencers without slugs
        result = await session.execute(select(Influencer))
        influencers = result.scalars().all()
        
        for influencer in influencers:
            if not influencer.slug:
                influencer.slug = await generate_unique_slug(
                    session, influencer.name, Influencer
                )
        
        await session.commit()
        print(f"Migrated {len(influencers)} influencers")

if __name__ == "__main__":
    asyncio.run(migrate_restaurants())
    asyncio.run(migrate_influencers())
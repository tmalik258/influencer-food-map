import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Restaurant, Influencer

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    if not name:
        return 'unnamed'
    
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

async def generate_unique_slug(
    session: AsyncSession, 
    name: str, 
    model, 
    existing_id: Optional[str] = None
) -> str:
    """Generate unique slug, handling duplicates"""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    while True:
        # Check if slug exists (excluding current record if updating)
        query = select(model).filter(model.slug == slug)
        if existing_id:
            query = query.filter(model.id != existing_id)
        
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            break
            
        # If duplicate exists, append counter
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

async def get_restaurant_by_slug(session: AsyncSession, slug: str) -> Optional[Restaurant]:
    """Get restaurant by slug"""
    result = await session.execute(
        select(Restaurant).filter(Restaurant.slug == slug, Restaurant.is_active == True)
    )
    return result.scalar_one_or_none()

async def get_influencer_by_slug(session: AsyncSession, slug: str) -> Optional[Influencer]:
    """Get influencer by slug"""
    result = await session.execute(
        select(Influencer).filter(Influencer.slug == slug)
    )
    return result.scalar_one_or_none()
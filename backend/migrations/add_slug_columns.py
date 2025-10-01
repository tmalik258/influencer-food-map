#!/usr/bin/env python3
"""
Migration script to add slug columns to restaurants and influencers tables.
This script should be run manually to update the Supabase database schema.
"""

import asyncio
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection (using the same URL as the backend)
DATABASE_URL = os.getenv("ASYNC_DATABASE_URL", "postgresql+asyncpg://postgres.rnkugchpqpcvmwpdpjqn:h5DHO08di1wvs5oH@aws-0-eu-west-2.pooler.supabase.com:5432/postgres")

async def add_slug_columns():
    """Add slug columns to restaurants and influencers tables"""
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        try:
            # Add slug column to restaurants table
            logger.info("Adding slug column to restaurants table...")
            await conn.execute(text("""
                ALTER TABLE restaurants 
                ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
            """))
            
            # Add slug column to influencers table
            logger.info("Adding slug column to influencers table...")
            await conn.execute(text("""
                ALTER TABLE influencers 
                ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
            """))
            
            # Create indexes for slug columns
            logger.info("Creating indexes for slug columns...")
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_influencers_slug ON influencers(slug);
            """))
            
            # Create composite indexes
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_restaurant_slug_active ON restaurants(slug, is_active);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_influencer_slug_created ON influencers(slug, created_at);
            """))
            
            logger.info("Slug columns and indexes added successfully!")
            
        except Exception as e:
            logger.error(f"Error adding slug columns: {e}")
            raise
        finally:
            await engine.dispose()

async def generate_slugs_for_existing_data():
    """Generate slugs for existing restaurants and influencers"""
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        try:
            # Generate slugs for existing restaurants
            logger.info("Generating slugs for existing restaurants...")
            result = await conn.execute(text("""
                SELECT id, name FROM restaurants WHERE slug IS NULL;
            """))
            restaurants = result.fetchall()
            
            for restaurant in restaurants:
                restaurant_id, name = restaurant
                slug = generate_slug(name)
                
                # Check if slug already exists
                existing = await conn.execute(text("""
                    SELECT id FROM restaurants WHERE slug = :slug;
                """), {"slug": slug})
                
                if existing.fetchone():
                    # If slug exists, append a counter
                    counter = 1
                    while True:
                        new_slug = f"{slug}-{counter}"
                        existing = await conn.execute(text("""
                            SELECT id FROM restaurants WHERE slug = :slug;
                        """), {"slug": new_slug})
                        
                        if not existing.fetchone():
                            slug = new_slug
                            break
                        counter += 1
                
                await conn.execute(text("""
                    UPDATE restaurants SET slug = :slug WHERE id = :id;
                """), {"slug": slug, "id": restaurant_id})
                
                logger.info(f"Generated slug '{slug}' for restaurant: {name}")
            
            # Generate slugs for existing influencers
            logger.info("Generating slugs for existing influencers...")
            result = await conn.execute(text("""
                SELECT id, name FROM influencers WHERE slug IS NULL;
            """))
            influencers = result.fetchall()
            
            for influencer in influencers:
                influencer_id, name = influencer
                slug = generate_slug(name)
                
                # Check if slug already exists
                existing = await conn.execute(text("""
                    SELECT id FROM influencers WHERE slug = :slug;
                """), {"slug": slug})
                
                if existing.fetchone():
                    # If slug exists, append a counter
                    counter = 1
                    while True:
                        new_slug = f"{slug}-{counter}"
                        existing = await conn.execute(text("""
                            SELECT id FROM influencers WHERE slug = :slug;
                        """), {"slug": new_slug})
                        
                        if not existing.fetchone():
                            slug = new_slug
                            break
                        counter += 1
                
                await conn.execute(text("""
                    UPDATE influencers SET slug = :slug WHERE id = :id;
                """), {"slug": slug, "id": influencer_id})
                
                logger.info(f"Generated slug '{slug}' for influencer: {name}")
            
            logger.info("Slugs generated for existing data successfully!")
            
        except Exception as e:
            logger.error(f"Error generating slugs: {e}")
            raise
        finally:
            await engine.dispose()

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    import re
    
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

async def main():
    """Main migration function"""
    logger.info("Starting slug migration...")
    
    try:
        # Step 1: Add slug columns
        await add_slug_columns()
        
        # Step 2: Generate slugs for existing data
        await generate_slugs_for_existing_data()
        
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
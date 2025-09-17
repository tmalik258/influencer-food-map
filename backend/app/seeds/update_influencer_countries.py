import asyncio
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, get_async_db
from app.models.influencer import Influencer
from app.utils.logging import setup_logger
from app.utils.country_utils import normalize_region_to_country_info

logger = setup_logger(__name__)



async def update_influencer_countries():
    """
    Update influencer records by converting region data to standardized country values.
    
    This seed script:
    1. Queries all influencers with non-empty region and null/undefined country fields
    2. Converts regions to ISO 3166-1 alpha-2 country codes
    3. Performs batch updates while preserving original region values
    4. Logs conversion statistics and handles errors gracefully
    """
    logger.info("Starting influencer country update process...")
    
    # Get database session
    db_gen = get_db()
    db: Session = next(db_gen)
    
    try:
        # Query influencers that need country updates
        influencers = db.query(Influencer).filter(
            Influencer.region.isnot(None),
            Influencer.region != "",
            # Influencer.country.is_(None)
        ).all()
        
        logger.info(f"Found {len(influencers)} influencers to process")
        
        if not influencers:
            logger.info("No influencers found that need country updates")
            return
        
        # Track conversion statistics
        stats = {
            "total_processed": 0,
            "successful_conversions": 0,
            "skipped_no_match": 0,
            "errors": 0
        }
        
        # Process each influencer
        updates_to_apply = []
        
        for influencer in influencers:
            stats["total_processed"] += 1
            
            try:
                logger.info(f"Processing influencer: {influencer.name} (Region: {influencer.region})")
                
                # Convert region to country code and name
                country_code, country_name = normalize_region_to_country_info(influencer.region)
                
                if country_name:
                    updates_to_apply.append({
                        "id": influencer.id,
                        "country": country_name,
                        "name": influencer.name,
                        "region": influencer.region
                    })
                    stats["successful_conversions"] += 1
                    logger.info(f"  ✓ Mapped '{influencer.region}' → '{country_name}' ({country_code}) for {influencer.name}")
                else:
                    stats["skipped_no_match"] += 1
                    logger.info(f"  ⚠ No country mapping found for '{influencer.region}' - preserving original region")
                    
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"  ✗ Error processing influencer {influencer.name}: {str(e)}")
        
        # Perform batch updates
        if updates_to_apply:
            logger.info(f"Applying {len(updates_to_apply)} country updates...")
            
            try:
                # Use bulk update for efficiency
                for update_data in updates_to_apply:
                    db.query(Influencer).filter(
                        Influencer.id == update_data["id"]
                    ).update({
                        "country": update_data["country"]
                    })
                
                # Commit all changes
                db.commit()
                logger.info("✓ All updates committed successfully")
                
            except Exception as e:
                db.rollback()
                logger.error(f"✗ Error during batch update: {str(e)}")
                raise
        
        # Log final statistics
        logger.info("\n" + "="*50)
        logger.info("CONVERSION STATISTICS")
        logger.info("="*50)
        logger.info(f"Total influencers processed: {stats['total_processed']}")
        logger.info(f"Successful conversions: {stats['successful_conversions']}")
        logger.info(f"Skipped (no match): {stats['skipped_no_match']}")
        logger.info(f"Errors encountered: {stats['errors']}")
        logger.info("="*50)
        
        if updates_to_apply:
            logger.info("\nCONVERSION DETAILS:")
            for update in updates_to_apply:
                logger.info(f"  {update['name']}: '{update['region']}' → '{update['country']}'")
        
        logger.info(f"\nInfluencer country update process completed successfully!")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Critical error during influencer country update: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(update_influencer_countries())
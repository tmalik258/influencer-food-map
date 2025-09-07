from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import func, select, distinct, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, Influencer, Listing, Video
from app.api_schema.dashboard import DashboardStatsResponse
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

class DashboardService:
    """Service for computing dashboard statistics efficiently."""
    
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> DashboardStatsResponse:
        """Get optimized dashboard statistics with minimal database queries."""
        try:
            # Get current date for monthly calculations
            now = datetime.utcnow()
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Execute separate optimized queries for better performance and reliability
            # Core counts
            total_restaurants = await db.scalar(
                select(func.count(Restaurant.id)).filter(Restaurant.is_active == True)
            ) or 0
            
            total_influencers = await db.scalar(
                select(func.count(Influencer.id))
            ) or 0
            
            total_listings = await db.scalar(
                select(func.count(Listing.id))
            ) or 0
            
            total_videos = await db.scalar(
                select(func.count(Video.id))
            ) or 0
            
            # Listing status counts
            approved_listings = await db.scalar(
                select(func.count(Listing.id)).filter(Listing.approved == True)
            ) or 0
            
            pending_listings = await db.scalar(
                select(func.count(Listing.id)).filter(Listing.approved == False)
            ) or 0
            
            # Restaurants with listings
            active_restaurants_with_listings = await db.scalar(
                select(func.count(distinct(Restaurant.id)))
                .select_from(Restaurant)
                .join(Listing, Restaurant.id == Listing.restaurant_id)
                .filter(Restaurant.is_active == True)
            ) or 0
            
            # Influencers with videos
            influencers_with_videos = await db.scalar(
                select(func.count(distinct(Influencer.id)))
                .select_from(Influencer)
                .join(Video, Influencer.id == Video.influencer_id)
            ) or 0
            
            # Monthly activity
            listings_this_month = await db.scalar(
                select(func.count(Listing.id)).filter(Listing.created_at >= start_of_month)
            ) or 0
            
            videos_this_month = await db.scalar(
                select(func.count(Video.id)).filter(Video.created_at >= start_of_month)
            ) or 0
            
            restaurants_this_month = await db.scalar(
                select(func.count(Restaurant.id)).filter(
                    and_(Restaurant.is_active == True, Restaurant.created_at >= start_of_month)
                )
            ) or 0
            
            # Geographic distribution
            total_cities = await db.scalar(
                select(func.count(distinct(Restaurant.city))).filter(
                    and_(Restaurant.is_active == True, Restaurant.city.isnot(None))
                )
            ) or 0
            
            total_countries = await db.scalar(
                select(func.count(distinct(Restaurant.country))).filter(
                    and_(Restaurant.is_active == True, Restaurant.country.isnot(None))
                )
            ) or 0
            
            # Create response with computed statistics
            stats = DashboardStatsResponse(
                total_restaurants=total_restaurants,
                total_influencers=total_influencers,
                total_listings=total_listings,
                total_videos=total_videos,
                approved_listings=approved_listings,
                pending_listings=pending_listings,
                active_restaurants_with_listings=active_restaurants_with_listings,
                influencers_with_videos=influencers_with_videos,
                listings_this_month=listings_this_month,
                videos_this_month=videos_this_month,
                restaurants_this_month=restaurants_this_month,
                total_cities=total_cities,
                total_countries=total_countries,
                last_updated=now
            )
            
            logger.info(f"Dashboard statistics computed successfully: {stats.total_restaurants} restaurants, {stats.total_listings} listings")
            return stats
            
        except Exception as e:
            logger.error(f"Error computing dashboard statistics: {str(e)}")
            raise
    
    @staticmethod
    async def get_dashboard_stats_simple(db: AsyncSession) -> Dict[str, Any]:
        """Simplified version with separate queries for better debugging."""
        try:
            now = datetime.utcnow()
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Execute queries separately for better error handling
            total_restaurants = await db.scalar(
                select(func.count(Restaurant.id)).filter(Restaurant.is_active == True)
            ) or 0
            
            total_influencers = await db.scalar(
                select(func.count(Influencer.id))
            ) or 0
            
            total_listings = await db.scalar(
                select(func.count(Listing.id))
            ) or 0
            
            total_videos = await db.scalar(
                select(func.count(Video.id))
            ) or 0
            
            approved_listings = await db.scalar(
                select(func.count(Listing.id)).filter(Listing.approved == True)
            ) or 0
            
            return {
                "total_restaurants": total_restaurants,
                "total_influencers": total_influencers,
                "total_listings": total_listings,
                "total_videos": total_videos,
                "approved_listings": approved_listings,
                "pending_listings": total_listings - approved_listings,
                "last_updated": now
            }
            
        except Exception as e:
            logger.error(f"Error in simplified dashboard stats: {str(e)}")
            raise
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db
from app.dependencies import get_current_admin
from app.utils.logging import setup_logger
from app.services.dashboard import DashboardService
from app.api_schema.dashboard import DashboardStatsResponse

logger = setup_logger(__name__)

router = APIRouter()

@router.get("/overview/", response_model=DashboardStatsResponse)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_admin)
) -> DashboardStatsResponse:
    """
    Get optimized dashboard overview with essential computed metrics.
    
    This endpoint provides aggregated statistics for the dashboard without
    fetching full data for restaurants, listings, influencers, and videos.
    Optimized for minimal loading time and reduced payload size.
    
    Returns:
        DashboardStatsResponse: Aggregated metrics and summary statistics
    """
    try:
        logger.info("Fetching dashboard overview statistics")
        stats = await DashboardService.get_dashboard_stats(db)
        logger.info(f"Dashboard overview retrieved successfully with {stats.total_restaurants} restaurants")
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching dashboard overview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard overview: {str(e)}"
        )

@router.get("/overview/simple/")
async def get_dashboard_overview_simple(
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """
    Simplified dashboard overview endpoint for debugging purposes.
    
    Returns basic statistics with separate queries for better error isolation.
    """
    try:
        logger.info("Fetching simplified dashboard overview")
        stats = await DashboardService.get_dashboard_stats_simple(db)
        logger.info("Simplified dashboard overview retrieved successfully")
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching simplified dashboard overview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch simplified dashboard overview: {str(e)}"
        )
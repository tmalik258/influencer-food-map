from typing import Dict, Any

from fastapi import HTTPException

from app.api_schema.geocoding import GeocodeRequest, GeocodeResponse
from app.services.google_places_service import geocode_address
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)


async def geocode_location(request: GeocodeRequest) -> GeocodeResponse:
    """
    Geocode an address to get latitude and longitude coordinates.
    
    Args:
        request: GeocodeRequest containing address, city, and country
        
    Returns:
        GeocodeResponse with latitude, longitude, and formatted address
    """
    logger.info(f"Geocoding request for: {request.address}, {request.city}, {request.country}")
    
    try:
        result = await geocode_address(
            address=request.address,
            city=request.city,
            country=request.country
        )
        
        return GeocodeResponse(
            latitude=result["latitude"],
            longitude=result["longitude"],
            formatted_address=result["formatted_address"]
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions from the service
        raise
    except Exception as e:
        logger.error(f"Unexpected error in geocoding endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during geocoding"
        )
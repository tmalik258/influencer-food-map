from fastapi import APIRouter, Query, HTTPException

from app.utils.logging import setup_logger
from app.api_schema.geocoding import GeocodeRequest, GeocodeResponse
from app.utils.geocoding_utils import geocode_location

router = APIRouter()

logger = setup_logger(__name__)

@router.get("/", response_model=GeocodeResponse)
async def geocode_location_get(
    address: str = Query(..., description="Street address"),
    city: str = Query(..., description="City name"),
    country: str = Query(..., description="Country name")
) -> GeocodeResponse:
    """
    Geocode an address to get latitude and longitude coordinates (GET method).
    
    Args:
        address: Street address
        city: City name
        country: Country name
        
    Returns:
        GeocodeResponse with latitude, longitude, and formatted address
    """
    # Validate input parameters
    if not address or not city or not country:
        raise HTTPException(status_code=400, detail="Address, city, and country are required")

    try:
        request = GeocodeRequest(address=address, city=city, country=country)
        return await geocode_location(request)
    except Exception as e:
        logger.error(f"Error geocoding location: {e}")
        raise HTTPException(status_code=500, detail="Failed to geocode location. Please try again later.")
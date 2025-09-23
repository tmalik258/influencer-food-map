from fastapi import APIRouter, Query

from app.api_schema.geocoding import GeocodeRequest, GeocodeResponse
from app.utils.geocoding_utils import geocode_location

router = APIRouter()


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
    request = GeocodeRequest(address=address, city=city, country=country)
    return await geocode_location(request)
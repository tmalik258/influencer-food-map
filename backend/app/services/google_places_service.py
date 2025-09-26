import asyncio
from typing import Optional
from fastapi import HTTPException, status
from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.config import GOOGLE_MAPS_API_KEY
from app.models.restaurant import BusinessStatus
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize Google Maps client
gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)


async def fetch_restaurant_details_from_google(restaurant_name: str, city: Optional[str] = None, country: str = "USA") -> dict:
    """Fetch restaurant details from Google Places API using restaurant name with optional city and country."""
    logger.info(f"Fetching restaurant details from Google API for: {restaurant_name}, city: {city}, country: {country}")
    
    if not restaurant_name or not restaurant_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant name is required"
        )

    # Build search query similar to transcription_nlp.py
    query_parts = [restaurant_name.strip()]
    if city and city.strip():
        query_parts.append(city.strip())
    if country and country.strip():
        query_parts.append(country.strip())
    
    query = " ".join(query_parts)
    logger.info(f"Google Places search query: {query}")

    loop = asyncio.get_event_loop()
    try:
        # Search for the restaurant using Google Places Text Search
        result = await loop.run_in_executor(
            None, 
            lambda: gmaps.places(query=query)
        )
        
        if result["status"] != "OK" or not result["results"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant '{restaurant_name}' not found in Google Places"
            )
        
        place = result["results"][0]
        logger.info(f"Found restaurant: {place['name']} ({place['place_id']})")
        
        # Extract photo URL if available
        photo_url = None
        try:
            photos = place.get("photos")
            if photos and len(photos) > 0:
                photo_reference = photos[0]["photo_reference"]
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_MAPS_API_KEY}"
                logger.info(f"Found photo for {place['name']}: {photo_url}")
        except Exception as photo_error:
            logger.warning(f"Could not extract photo for {place['name']}: {photo_error}")
        
        logger.info(f"Restaurant details: {place}")

        # Extract address components
        address_components = place.get("address_components", [])

        for component in address_components:
            types = component.get("types", [])
            if "locality" in types:
                city = component["long_name"]
            elif "country" in types:
                country = component["long_name"]
        
        return {
            "name": place["name"],
            "address": place.get("formatted_address", ""),
            "latitude": place["geometry"]["location"]["lat"],
            "longitude": place["geometry"]["location"]["lng"],
            "city": city,
            "country": country,
            "google_place_id": place["place_id"],
            "google_rating": place.get("rating"),
            "business_status": place.get("business_status", BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value),
            "photo_url": photo_url,
        }
        
    except ApiError as e:
        logger.error(f"Google Places API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Places API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching restaurant details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching restaurant details: {str(e)}"
        )


async def geocode_address(address: str, city: str, country: str) -> dict:
    """Geocode an address to get latitude and longitude coordinates."""
    logger.info(f"Geocoding address: {address}, {city}, {country}")
    
    if not address or not city or not country:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address, city, and country are all required"
        )

    # Construct full address string
    full_address = f"{address.strip()}, {city.strip()}, {country.strip()}"
    
    loop = asyncio.get_event_loop()
    try:
        # Use Google Maps Geocoding API
        result = await loop.run_in_executor(
            None, 
            lambda: gmaps.geocode(full_address)
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not geocode address: {full_address}"
            )
        
        location = result[0]["geometry"]["location"]
        formatted_address = result[0]["formatted_address"]
        
        logger.info(f"Successfully geocoded address: {formatted_address} -> ({location['lat']}, {location['lng']})")
        
        return {
            "latitude": location["lat"],
            "longitude": location["lng"],
            "formatted_address": formatted_address,
            "address_components": result[0].get("address_components", [])
        }
        
    except ApiError as e:
        logger.error(f"Google Geocoding API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Geocoding API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error geocoding address: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error geocoding address: {str(e)}"
        )
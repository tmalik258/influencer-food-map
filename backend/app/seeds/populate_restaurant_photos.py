import asyncio
from sqlalchemy.orm import Session

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.config import GOOGLE_MAPS_API_KEY
from app.database import get_db
from app.models.restaurant import Restaurant

# Initialize Google Maps client
gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

async def get_google_place_photo_url(google_place_id: str) -> str | None:
    """
    Fetch Google Place photo URL using the googlemaps library
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: GOOGLE_MAPS_API_KEY not found in environment variables")
        return None
    
    if not google_place_id:
        return None
    
    loop = asyncio.get_event_loop()
    try:
        # Get place details with photos using googlemaps library
        place_details = await loop.run_in_executor(
            None, 
            lambda: gmaps.place(place_id=google_place_id, fields=['photo'])
        )
        
        if place_details["status"] != "OK":
            print(f"Failed to get place details for {google_place_id}: {place_details['status']}")
            return None
            
        photos = place_details["result"].get("photos")
        if not photos:
            return None

        # Get the first photo reference
        photo_reference = photos[0].get("photo_reference")
        if not photo_reference:
            return None

        # Construct the photo URL using the legacy Places API format
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?photoreference={photo_reference}&maxwidth=400&key={GOOGLE_MAPS_API_KEY}"
        return photo_url
    except ApiError as e:
        print(f"API error fetching photo for place {google_place_id}: {str(e)}")
        return None
    except Exception as e:
        print(f"Error fetching photo for place {google_place_id}: {str(e)}")
        return None

async def populate_restaurant_photos():
    """
    Populate photo_url field for all restaurants that have google_place_id but no photo_url
    """
    print("Starting to populate restaurant photos...")
    
    # Get database session
    db_gen = get_db()
    db: Session = next(db_gen)
    
    try:
        # Get all restaurants that have google_place_id but no photo_url
        restaurants = db.query(Restaurant).filter(
            Restaurant.google_place_id.isnot(None),
            Restaurant.photo_url.is_(None)
        ).all()
        
        print(f"Found {len(restaurants)} restaurants to update")
        
        updated_count = 0
        for restaurant in restaurants:
            print(f"Processing {restaurant.name} (ID: {restaurant.id})...")
            
            photo_url = await get_google_place_photo_url(restaurant.google_place_id)
            
            if photo_url:
                restaurant.photo_url = photo_url
                updated_count += 1
                print(f"  ✓ Updated photo URL for {restaurant.name}")
            else:
                print(f"  ✗ No photo found for {restaurant.name}")
            
            # Add a small delay to avoid hitting API rate limits
            await asyncio.sleep(0.1)
        
        # Commit all changes
        db.commit()
        print(f"\nCompleted! Updated {updated_count} out of {len(restaurants)} restaurants.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during population: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(populate_restaurant_photos())
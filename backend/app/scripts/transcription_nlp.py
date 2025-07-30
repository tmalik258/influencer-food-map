import os
import json
import uuid
import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import yt_dlp
import whisper
from openai import OpenAI
from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError
from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag
from app.config import GOOGLE_MAPS_API_KEY, OPENAI_API_KEY
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize clients (synchronous, will run in executor)
whisper_model = whisper.load_model("base")
openai_client = OpenAI(api_key=OPENAI_API_KEY)
gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

async def download_audio(video_url: str, output_path: str = "temp_audio.mp3") -> str:
    """Download audio from a YouTube video using yt-dlp."""
    loop = asyncio.get_event_loop()
    try:
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": output_path,
            "quiet": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            await loop.run_in_executor(None, lambda: ydl.download([video_url]))
        return output_path
    except Exception as e:
        logger.error(f"Error downloading audio for {video_url}: {e}")
        raise

async def transcribe_video(audio_path: str) -> str:
    """Transcribe audio using Whisper."""
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, lambda: whisper_model.transcribe(audio_path))
        transcription = result["text"]
        logger.info(f"Transcription completed for {audio_path}")
        return transcription
    except Exception as e:
        logger.error(f"Error transcribing audio {audio_path}: {e}")
        raise
    finally:
        if os.path.exists(audio_path):
            await loop.run_in_executor(None, lambda: os.remove(audio_path))

async def extract_entities(transcription: str) -> dict:
    """Extract restaurant name, location, context, and tags using GPT-4."""
    loop = asyncio.get_event_loop()
    try:
        prompt = f"""
        Analyze the following transcription from a food vlogger's YouTube video and extract:
        - Restaurant name (if mentioned)
        - Location (address, city, country)
        - Context (key quotes or sentiment about the restaurant, if any)
        - Tags (e.g., BBQ, vegan, Italian, spicy, etc., based on food or cuisine mentioned)
        - Confidence score (0-1, based on clarity of information)
        Return the result as a JSON object. If no restaurant is mentioned, return an empty object.
        Transcription: {transcription[:4000]}  # Limit to avoid token limits
        """
        response = await loop.run_in_executor(
            None,
            lambda: openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
        )
        entities = json.loads(response.choices[0].message.content)
        return entities
    except Exception as e:
        logger.error(f"Error extracting entities: {e}")
        return {}

async def validate_restaurant(entities: dict) -> dict:
    """Validate restaurant details using Google Maps Places API."""
    if not entities.get("restaurant_name") or not entities.get("location"):
        return {"valid": False}
    
    loop = asyncio.get_event_loop()
    try:
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        result = await loop.run_in_executor(None, lambda: gmaps.places(query=query))
        if result["status"] == "OK" and result["results"]:
            place = result["results"][0]
            return {
                "valid": True,
                "name": place["name"],
                "address": place.get("formatted_address", ""),
                "latitude": place["geometry"]["location"]["lat"],
                "longitude": place["geometry"]["location"]["lng"],
                "city": entities["location"].get("city"),
                "country": entities["location"].get("country"),
                "google_place_id": place["place_id"],
                "google_rating": place.get("rating"),
                "confidence_score": entities.get("confidence_score", 0.8),
                "tags": entities.get("tags", [])
            }
        return {"valid": False}
    except ApiError as e:
        logger.error(f"Error validating restaurant with Google Maps: {e}")
        return {"valid": False}

async def store_restaurant_and_listing(db: AsyncSession, video: Video, entities: dict, validated: dict):
    """Store restaurant, listing, and tags in the database."""
    try:
        if validated["valid"]:
            # Check for existing restaurant
            result = await db.execute(
                select(Restaurant).filter(Restaurant.google_place_id == validated["google_place_id"])
            )
            restaurant = result.scalars().first()
            if not restaurant:
                restaurant = Restaurant(
                    id=uuid.uuid4(),
                    name=validated["name"],
                    address=validated["address"],
                    latitude=validated["latitude"],
                    longitude=validated["longitude"],
                    city=validated["city"],
                    country=validated["country"],
                    google_place_id=validated["google_place_id"],
                    google_rating=validated["google_rating"],
                    is_active=True
                )
                db.add(restaurant)
                await db.commit()
                await db.refresh(restaurant)
            
            # Store tags
            for tag_name in validated.get("tags", []):
                tag_name = tag_name.lower().strip()
                result = await db.execute(select(Tag).filter(Tag.name == tag_name))
                tag = result.scalars().first()
                if not tag:
                    tag = Tag(id=uuid.uuid4(), name=tag_name)
                    db.add(tag)
                    await db.commit()
                    await db.refresh(tag)
                
                # Check for existing restaurant_tag
                result = await db.execute(
                    select(RestaurantTag).filter(
                        RestaurantTag.restaurant_id == restaurant.id,
                        RestaurantTag.tag_id == tag.id
                    )
                )
                if not result.scalars().first():
                    restaurant_tag = RestaurantTag(
                        restaurant_id=restaurant.id,
                        tag_id=tag.id
                    )
                    db.add(restaurant_tag)
                    await db.commit()
            
            # Store listing
            listing = Listing(
                id=uuid.uuid4(),
                restaurant_id=restaurant.id,
                video_id=video.id,
                influencer_id=video.influencer_id,
                quotes=entities.get("context", {}).get("quotes", []),
                confidence_score=validated["confidence_score"],
                approved=False  # Requires admin approval
            )
            db.add(listing)
            await db.commit()
            logger.info(f"Stored restaurant {restaurant.name}, tags, and listing for video {video.youtube_video_id}")
    except Exception as e:
        logger.error(f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}")
        await db.rollback()

async def process_video(db: AsyncSession, video: Video):
    """Process a single video: transcribe, extract entities, validate, and store."""
    try:
        # Skip if already transcribed
        if video.transcription:
            logger.info(f"Skipping transcription for video {video.youtube_video_id} (already transcribed)")
            return
        
        # Download and transcribe
        audio_path = await download_audio(video.video_url)
        transcription = await transcribe_video(audio_path)
        
        # Update video with transcription
        video.transcription = transcription
        await db.commit()
        
        # Extract entities
        entities = await extract_entities(transcription)
        if not entities:
            logger.info(f"No restaurant entities found for video {video.youtube_video_id}")
            return
        
        # Validate with Google Maps
        validated = await validate_restaurant(entities)
        if not validated["valid"]:
            logger.info(f"No valid restaurant found for video {video.youtube_video_id}")
            return
        
        # Store restaurant, tags, and listing
        await store_restaurant_and_listing(db, video, entities, validated)
    except Exception as e:
        logger.error(f"Error processing video {video.youtube_video_id}: {e}")

async def transcription_nlp_pipeline(db: AsyncSession):
    """Main pipeline to process 10+ sample videos."""
    try:
        # Select one video per influencer (up to 13 influencers)
        result = await db.execute(
            select(Video)
            .join(Influencer)
            .distinct(Influencer.id)
            .order_by(Influencer.id, Video.published_at.desc())
            .limit(13)
            .options(selectinload(Video.influencer))
        )
        videos = result.scalars().all()
        logger.info(f"Selected {len(videos)} videos for processing")
        
        # Process videos concurrently
        tasks = [asyncio.create_task(process_video(db, video)) for video in videos]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("Transcription and NLP pipeline completed")
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
    finally:
        await db.close()

# if __name__ == "__main__":
#     from app.database import AsyncSessionLocal
#     async def main():
#         db = AsyncSessionLocal()
#         try:
#             await transcription_nlp_pipeline(db)
#         finally:
#             await db.close()
    
#     asyncio.run(main())
import os
import uuid
import redis
import yt_dlp
import asyncio
import tempfile
import subprocess

from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.sql import func, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag, Cuisine, RestaurantCuisine, BusinessStatus
from app.config import (
    GOOGLE_MAPS_API_KEY,
    REDIS_URL,
    TRANSCRIPTION_NLP_LOCK,
    AUDIO_BASE_DIR,
)
from app.database import AsyncSessionLocal
from app.utils.logging import setup_logger
from app.scripts.gpt_food_place_processor import GPTFoodPlaceProcessor

# Setup logging
logger = setup_logger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

async def download_audio(video_url: str, video: Video) -> str:
    """Download audio from a YouTube video and explicitly convert with FFmpeg."""
    # Create base directory if it doesn't exist
    os.makedirs(AUDIO_BASE_DIR, exist_ok=True)

    # Use influencer's name as subfolder (sanitized)
    influencer_name = (
        video.influencer.name.replace(" ", "_").replace("/", "_")
        if video.influencer
        else "unknown"
    )
    influencer_dir = os.path.join(AUDIO_BASE_DIR, influencer_name)
    os.makedirs(influencer_dir, exist_ok=True)

    # Sanitize video title for filename
    # video_title = (
    #     video.title.replace(" ", "_").replace("/", "_").replace("\\", "_")[:50]
    #     if video.title
    #     else str(uuid.uuid4())
    # )
    base_filename = video.youtube_video_id

    # Final output path (what we'll return)
    final_output_path = os.path.join(influencer_dir, f"{base_filename}_converted.mp3")

    ## Verify the file exists and has content
    if (
        os.path.exists(final_output_path)
        and os.path.getsize(final_output_path) > 0
    ):
        logger.info(
            f"Audio file already exists and has content: {final_output_path}"
        )
        return final_output_path

    loop = asyncio.get_event_loop()
    max_retries = 3

    for attempt in range(max_retries):
        downloaded_file = None
        temp_file = None
        try:
            logger.info(
                f"Attempt {attempt + 1}/{max_retries} downloading audio for {video_url}"
            )

            # Step 1: Download to temporary file
            with tempfile.NamedTemporaryFile(
                suffix=".%(ext)s", delete=False
            ) as temp_file:
                temp_output_template = temp_file.name

            ydl_opts = {
                "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
                "outtmpl": temp_output_template,
                "quiet": True,
                "retries": 3,
                "fragment_retries": 10,
                "extractor_retries": 10,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }

            # Download the audio
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await loop.run_in_executor(None, lambda: ydl.download([video_url]))

            # Find the downloaded file
            temp_dir = os.path.dirname(temp_output_template)
            temp_base = os.path.splitext(os.path.basename(temp_output_template))[0]

            # Look for the actual downloaded file
            for file in os.listdir(temp_dir):
                if file.startswith(temp_base) and file.endswith(".mp3"):
                    downloaded_file = os.path.join(temp_dir, file)
                    break

            if not downloaded_file or not os.path.exists(downloaded_file):
                raise Exception("Downloaded file not found")

            logger.info(f"Downloaded temporary file: {downloaded_file}")

            # Step 2: Convert with FFmpeg to ensure proper format
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                downloaded_file,  # Input file
                "-ar",
                "16000",  # Sample rate: 16kHz
                "-ac",
                "1",  # Audio channels: mono
                "-y",  # Overwrite output file
                final_output_path,  # Output file
            ]

            logger.info(f"Converting audio with FFmpeg: {' '.join(ffmpeg_command)}")

            # Run FFmpeg conversion
            result = await loop.run_in_executor(
                None,
                lambda: subprocess.run(
                    ffmpeg_command, check=True, capture_output=True, text=True
                ),
            )

            # Clean up temporary file
            if os.path.exists(downloaded_file):
                os.remove(downloaded_file)

            # Verify the final file exists and has content
            if (
                os.path.exists(final_output_path)
                and os.path.getsize(final_output_path) > 0
            ):
                logger.info(
                    f"Audio successfully converted and saved to: {final_output_path}"
                )
                return final_output_path
            else:
                raise Exception("Converted file is empty or doesn't exist")

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed for {video_url}: {e.stderr}")
            # Clean up files on error
            if downloaded_file and os.path.exists(downloaded_file):
                os.remove(downloaded_file)
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            if attempt == max_retries - 1:
                raise Exception(f"FFmpeg conversion failed: {e.stderr}")
            await asyncio.sleep(2**attempt)

        except yt_dlp.utils.DownloadError as e:
            logger.error(
                f"Attempt {attempt + 1}/{max_retries} failed for {video_url}: {e}"
            )
            # Clean up files on error
            if downloaded_file and os.path.exists(downloaded_file):
                os.remove(downloaded_file)
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2**attempt)

        except Exception as e:
            logger.error(
                f"Unexpected error on attempt {attempt + 1}/{max_retries} for {video_url}: {e}"
            )
            # Clean up files on error
            if downloaded_file and os.path.exists(downloaded_file):
                os.remove(downloaded_file)
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2**attempt)

    raise Exception("Max retries exceeded for audio download and conversion")


# async def transcribe_video(audio_path: str) -> str:
#     """Transcribe audio using Whisper."""
#     loop = asyncio.get_event_loop()
#     audio_file_path = Path(audio_path)
#     temp_dir = audio_file_path.parent

#     try:
#         logger.info(f"Transcribing audio {audio_path}")
#         # model = whisper.load_model("large-v2")
#         segments, _ = await loop.run_in_executor(
#             None,
#             lambda: model.transcribe(
#                 audio_path,
#                 word_timestamps=True  # Optional: enable word-level timestamps
#             ),
#         )
        
#         # Combine segments into one full transcription
#         transcription = "".join([segment.text for segment in segments])

#         logger.info(f"Transcription completed for {audio_path}")
#         return transcription
#     except Exception as e:
#         logger.error(f"Error transcribing audio {audio_path}: {e}")
#         raise
#     finally:
#         # Clean up both file and directory
#         await loop.run_in_executor(None, cleanup_temp_files, audio_file_path, temp_dir)




async def validate_restaurant(entities: dict) -> dict:
    """Validate restaurant details using Google Maps Places API with referer header."""
    logger.info(f"Validating restaurant using Google Maps: {entities}")
    if not entities.get("restaurant_name") or not entities.get("location"):
        logger.warning("No restaurant name or location found")
        return {"valid": False}

    loop = asyncio.get_event_loop()
    try:
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        result = await loop.run_in_executor(None, lambda: gmaps.places(query=query))
        if result["status"] == "OK" and result["results"]:
            place = result["results"][0]
            logger.info(
                f"Validated restaurant with Google Maps: {place['name']} ({place['place_id']})"
            )
            
            # Extract photo URL from Text Search response (no additional API call needed)
            photo_url = None
            try:
                photos = place.get("photos")
                if photos and len(photos) > 0:
                    photo_reference = photos[0]["photo_reference"]
                    # Construct photo URL using legacy Google Places API format
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_MAPS_API_KEY}"
                    logger.info(f"Found photo for {place['name']}: {photo_url}")
                else:
                    logger.info(f"No photos found for {place['name']}")
            except Exception as photo_error:
                logger.warning(f"Could not extract photo for {place['name']}: {photo_error}")
            
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
                "business_status": place.get("business_status", BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value),
                "photo_url": photo_url,
                "confidence_score": entities.get("confidence_score", 0.8),
                "tags": entities.get("tags", []),
                "cuisines": entities.get("cuisines", []),
            }
        return {"valid": False}
    except ApiError as e:
        logger.error(f"Error validating restaurant with Google Maps: {e}")
        return {"valid": False}


async def store_restaurant_and_listing(
    db: AsyncSession, video: Video, entities: dict, validated: dict
):
    """Store restaurant, listing, and tags in the database."""
    try:
        logger.info(f"Storing restaurant and listing for video {video.youtube_video_id}")
        if validated["valid"]:
            # Check for existing restaurant
            result = await db.execute(
                select(Restaurant).filter(
                    Restaurant.google_place_id == validated["google_place_id"]
                )
            )
            restaurant = result.scalars().first()
            if not restaurant:
                restaurant = Restaurant(
                    name=validated["name"],
                    address=validated["address"],
                    latitude=validated["latitude"],
                    longitude=validated["longitude"],
                    city=validated["city"],
                    country=validated["country"],
                    google_place_id=validated["google_place_id"],
                    google_rating=validated["google_rating"],
                    business_status=validated["business_status"],
                    photo_url=validated["photo_url"],
                    is_active=True,
                )
                db.add(restaurant)
                await db.flush()
                await db.refresh(restaurant)
            else:
                restaurant.business_status = validated["business_status"]
                await db.flush()

            # Store tags
            for tag_name in validated.get("tags", []):
                tag_name = tag_name.lower().strip()
                result = await db.execute(select(Tag).filter(Tag.name == tag_name))
                tag = result.scalars().first()
                if not tag:
                    tag = Tag(id=uuid.uuid4(), name=tag_name)
                    db.add(tag)
                    await db.flush()
                    await db.refresh(tag)

                # Check for existing restaurant_tag
                result = await db.execute(
                    select(RestaurantTag).filter(
                        RestaurantTag.restaurant_id == restaurant.id,
                        RestaurantTag.tag_id == tag.id,
                    )
                )
                if not result.scalars().first():
                    restaurant_tag = RestaurantTag(
                        restaurant_id=restaurant.id, tag_id=tag.id
                    )
                    db.add(restaurant_tag)
                    await db.flush()

            # Store cuisines
            for cuisine_name in validated.get("cuisines", []):
                cuisine_name = cuisine_name.lower().strip()
                result = await db.execute(select(Cuisine).filter(Cuisine.name == cuisine_name))
                cuisine = result.scalars().first()
                if not cuisine:
                    cuisine = Cuisine(id=uuid.uuid4(), name=cuisine_name)
                    db.add(cuisine)
                    await db.flush()
                    await db.refresh(cuisine)

                # Check for existing restaurant_cuisine
                result = await db.execute(
                    select(RestaurantCuisine).filter(
                        RestaurantCuisine.restaurant_id == restaurant.id,
                        RestaurantCuisine.cuisine_id == cuisine.id,
                    )
                )
                if not result.scalars().first():
                    restaurant_cuisine = RestaurantCuisine(
                        restaurant_id=restaurant.id, cuisine_id=cuisine.id
                    )
                    db.add(restaurant_cuisine)
                    await db.flush()

            # Store listing
            if not isinstance(db, AsyncSession):
                raise ValueError("db is not an AsyncSession instance")

            result = await db.execute(
                select(Listing)
                .filter(Listing.restaurant_id == restaurant.id)
                .filter(Listing.video_id == video.id)
                .filter(Listing.influencer_id == video.influencer_id)
            )
            existing_listing = result.scalar()
            if existing_listing:
                logger.warning(
                    f"Listing already exists for video {video.youtube_video_id}"
                )
                if existing_listing.visit_date is None:
                    existing_listing.visit_date = video.published_at.date()
                existing_listing.quotes = entities.get("quotes", [])
                existing_listing.context = entities.get("context", [])
                existing_listing.confidence_score = validated["confidence_score"]
                await db.flush()
                return

            listing = Listing(
                restaurant_id=restaurant.id,
                video_id=video.id,
                influencer_id=video.influencer_id,
                visit_date=video.published_at.date() if video.published_at else None,
                quotes=entities.get("quotes", []),
                context=entities.get("context", []),
                confidence_score=validated["confidence_score"],
                approved=False,  # Requires admin approval
            )
            db.add(listing)
            await db.flush()
            logger.info(
                f"Stored restaurant {restaurant.name}, tags, and listing for video {video.youtube_video_id}"
            )
        else:
            logger.warning(
                f"Skipped storing restaurant and listing for video {video.youtube_video_id} (invalid)"
            )
    except HTTPException as e:
        logger.error(
            f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}"
        )
        raise
    except Exception as e:
        logger.error(
            f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}"
        )
        raise # Let the outer transaction handle the rollback


async def process_video(video: Video):
    """Process a single video: transcribe, extract entities, validate, and store."""
    async with AsyncSessionLocal() as db:  # Create a new session for each video
        async with db.begin():  # Start a transaction for the entire process
            try:
                logger.info(f"Processing video {video.youtube_video_id}")

                # Merge the video object into the new session
                video = await db.merge(video)

                transcription = video.transcription or ""

                gpt_processor = GPTFoodPlaceProcessor()

                # If no transcription, download and transcribe
                if not transcription:
                    logger.info(
                        f"No transcription found for video {video.youtube_video_id}, downloading and transcribing..."
                    )
                    audio_path = await download_audio(video.video_url, video)
                    transcription = await gpt_processor.transcribe_audio(audio_path)

                    logger.info(
                        f"Transcription completed for video {video.youtube_video_id}: {transcription[:255]}..."
                    )

                    # Update video with transcription
                    video.transcription = transcription
                    db.add(video)
                    await db.flush()

                # Extract entities
                entities_list = await gpt_processor.extract_entities(video.description, transcription)
                if not entities_list:
                    logger.info(
                        f"No restaurant entities found for video {video.youtube_video_id}"
                    )
                    return
                logger.info(
                    f"Entities extracted for video {video.youtube_video_id}: {entities_list}"
                )

                for entity in entities_list:
                    # Validate with Google Maps
                    validated = await validate_restaurant(entity)
                    if not validated["valid"]:
                        logger.info(
                            f"No valid restaurant found for video {video.youtube_video_id}"
                        )
                        continue
                    logger.info(
                        f"Validated restaurant for video {video.youtube_video_id}: {validated}"
                    )

                    # Store restaurant, tags, and listing
                    await store_restaurant_and_listing(db, video, entity, validated)

                logger.info(
                    f"Stored restaurant, tags, and listing for video {video.youtube_video_id}"
                )
            except Exception as e:
                logger.error(f"Error processing video {video.youtube_video_id}: {e}")
                raise  # Let the transaction rollback automatically


async def transcription_nlp_pipeline(db: AsyncSession):
    """Main pipeline to process 10+ sample videos."""
    try:
        # Limit to 4-5 concurrent downloads to avoid rate limits
        semaphore = asyncio.Semaphore(5)  # Only 5 concurrent downloads

        # Select one video per influencer
        result = await db.execute(
            select(Video)
            .join(Influencer)
            .distinct(Influencer.id)
            .order_by(
                Influencer.id,
                case(
                    (Video.transcription.is_(None), 1),
                    else_=0
                ).asc(),  # Videos with transcriptions (non-null) come first
                func.length(Video.transcription).asc(),  # Sort by transcription length (smallest to largest)
                Video.published_at.desc()
            )
            .limit(10)
            .options(selectinload(Video.influencer))
        )
        videos = result.scalars().all()

        logger.info(f"Selected {len(videos)} videos for processing")

        async def process_with_semaphore(video):
            async with semaphore:
                await asyncio.sleep(1)  # Add 1-second delay between downloads
                return await process_video(video)

        # Process videos concurrently
        tasks = [process_with_semaphore(video) for video in videos]
        await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("Transcription and NLP pipeline completed")
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
    finally:
        await db.close()
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Ensure lock is released

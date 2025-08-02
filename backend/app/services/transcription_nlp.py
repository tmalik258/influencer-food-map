import os
import json
import uuid
import redis
import yt_dlp
import asyncio
import whisper
import tempfile
import subprocess

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag
from app.config import (
    GOOGLE_MAPS_API_KEY,
    REDIS_URL,
    TRANSCRIPTION_NLP_LOCK,
    AUDIO_BASE_DIR,
)
from app.database import AsyncSessionLocal
from app.utils.logging import setup_logger
from app.scripts.gpt_entities_extractor import GPTEntityExtractor

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
    video_title = (
        video.title.replace(" ", "_").replace("/", "_").replace("\\", "_")[:50]
        if video.title
        else str(uuid.uuid4())
    )
    base_filename = video.youtube_video_id

    # Final output path (what we'll return)
    final_output_path = os.path.join(influencer_dir, f"{base_filename}_converted.mp3")

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
                "format": "bestaudio/best",
                "outtmpl": temp_output_template,
                "quiet": True,
                "retries": 3,
                "fragment_retries": 3,
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


async def transcribe_video(audio_path: str) -> str:
    """Transcribe audio using Whisper."""
    loop = asyncio.get_event_loop()
    try:
        logger.info(f"Transcribing audio {audio_path}")
        model = whisper.load_model("base")
        result = await loop.run_in_executor(
            None,
            lambda: model.transcribe(
                audio_path,
                fp16=False,  # Explicitly disable FP16
                verbose=False,  # Reduce verbosity
            ),
        )
        transcription = result["text"]
        logger.info(f"Transcription completed for {audio_path}")
        return transcription
    except Exception as e:
        logger.error(f"Error transcribing audio {audio_path}: {e}")
        raise
    finally:
        if os.path.exists(audio_path):
            await loop.run_in_executor(None, lambda: os.remove(audio_path))


async def validate_restaurant(entities: dict) -> dict:
    """Validate restaurant details using Google Maps Places API with referer header."""
    logger.info(f"Validating restaurant: {entities}")
    if not entities.get("restaurant_name") or not entities.get("location"):
        logger.warning("No restaurant name or location found")
        return {"valid": False}

    loop = asyncio.get_event_loop()
    try:
        logger.info(f"Validating restaurant with Google Maps: {entities}")
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        result = await loop.run_in_executor(None, lambda: gmaps.places(query=query))
        if result["status"] == "OK" and result["results"]:
            place = result["results"][0]
            logger.info(
                f"Validated restaurant with Google Maps: {json.dumps(place, indent=2)}"
            )
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
                "tags": entities.get("tags", []),
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
                    id=uuid.uuid4(),
                    name=validated["name"],
                    address=validated["address"],
                    latitude=validated["latitude"],
                    longitude=validated["longitude"],
                    city=validated["city"],
                    country=validated["country"],
                    google_place_id=validated["google_place_id"],
                    google_rating=validated["google_rating"],
                    is_active=True,
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
                        RestaurantTag.tag_id == tag.id,
                    )
                )
                if not result.scalars().first():
                    restaurant_tag = RestaurantTag(
                        restaurant_id=restaurant.id, tag_id=tag.id
                    )
                    db.add(restaurant_tag)
                    await db.commit()

            # Store listing
            listing = Listing(
                id=uuid.uuid4(),
                restaurant_id=restaurant.id,
                video_id=video.id,
                influencer_id=video.influencer_id,
                quotes=entities.get("context", []),
                confidence_score=validated["confidence_score"],
                approved=False,  # Requires admin approval
            )
            db.add(listing)
            await db.commit()
            logger.info(
                f"Stored restaurant {restaurant.name}, tags, and listing for video {video.youtube_video_id}"
            )
    except Exception as e:
        logger.error(
            f"Error storing restaurant/listing/tags for video {video.youtube_video_id}: {e}"
        )
        await db.rollback()


async def process_video(video: Video):
    """Process a single video: transcribe, extract entities, validate, and store."""
    async with AsyncSessionLocal() as db:  # Create a new session for each video
        async with db.begin():  # Start a transaction for the entire process
            try:
                logger.info(f"Processing video {video.youtube_video_id}")

                transcription = video.transcription or ""

                # If no transcription, download and transcribe
                if not video.transcription:
                    logger.info(
                        f"No transcription found for video {video.youtube_video_id}, downloading and transcribing..."
                    )
                    audio_path = await download_audio(video.video_url, video)
                    transcription = await transcribe_video(audio_path)

                    logger.info(
                        f"Transcription completed for video {video.youtube_video_id}: {transcription[:255]}..."
                    )

                    # Update video with transcription
                    video.transcription = transcription
                    db.add(video)
                    await db.flush()

                # Extract entities
                extracter = GPTEntityExtractor()
                entities = await extracter.extract_entities(transcription)
                if not entities:
                    logger.info(
                        f"No restaurant entities found for video {video.youtube_video_id}"
                    )
                    return
                logger.info(
                    f"Entities extracted for video {video.youtube_video_id}: {entities}"
                )

                for entity in entities:
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
        # Select one video per influencer (up to 5 influencers)
        result = await db.execute(
            select(Video)
            .join(Influencer)
            .distinct(Influencer.id)
            .order_by(Influencer.id, Video.published_at.desc())
            .limit(3)
            .options(selectinload(Video.influencer))
        )
        videos = result.scalars().all()
        logger.info(f"Selected {len(videos)} videos for processing")

        # Process videos concurrently
        tasks = [asyncio.create_task(process_video(video)) for video in videos]
        await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("Transcription and NLP pipeline completed")
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
    finally:
        await db.close()
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Ensure lock is released

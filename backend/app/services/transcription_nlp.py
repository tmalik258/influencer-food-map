import os
import uuid
import redis
import yt_dlp
import asyncio
import tempfile
import subprocess
from datetime import datetime, timedelta
import json
import time
import re
from typing import Optional, Dict, Any, Tuple

from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.sql import func, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from googlemaps import Client as GoogleMapsClient
from app.api_schema.jobs import JobUpdateRequest
from googlemaps.exceptions import ApiError

from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag, Cuisine, RestaurantCuisine, BusinessStatus
from app.config import (
    GOOGLE_MAPS_API_KEY,
    REDIS_URL,
    TRANSCRIPTION_NLP_LOCK,
    AUDIO_BASE_DIR,
    YOUTUBE_API_KEY,
)
from app.database import AsyncSessionLocal
from app.utils.logging import setup_logger
from app.scripts.gpt_food_place_processor import GPTFoodPlaceProcessor
from app.services.jobs import JobService
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import HttpRequest

# Setup logging
logger = setup_logger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

# Custom HTTP client to add referer header for YouTube API
class CustomHttpRequest(HttpRequest):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.headers["referer"] = "http://localhost:8030"  # Adjust for your domain

def build_youtube_client():
    """Build YouTube API client with custom referer header."""
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, requestBuilder=CustomHttpRequest)

youtube = build_youtube_client()

async def get_channel_from_video_url(video_url: str) -> Optional[Dict[str, Any]]:
    """Extract channel data from a YouTube video URL.
    
    Args:
        video_url: The YouTube video URL
        
    Returns:
        Dictionary containing channel data or None if not found
    """
    try:
        # Extract video ID from URL
        video_id_match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', video_url)
        if not video_id_match:
            logger.error(f"Could not extract video ID from URL: {video_url}")
            return None
            
        video_id = video_id_match.group(1)
        
        # Get video details to extract channel ID
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: youtube.videos().list(
                part="snippet",
                id=video_id
            ).execute()
        )
        
        if "items" not in response or len(response["items"]) == 0:
            logger.error(f"No video found for ID: {video_id}")
            return None
            
        video_data = response["items"][0]
        snippet = video_data["snippet"]
        channel_id = snippet["channelId"]
        
        # Get channel details
        channel_response = await loop.run_in_executor(
            None,
            lambda: youtube.channels().list(
                part="id,snippet,brandingSettings,statistics",
                id=channel_id
            ).execute()
        )
        
        if "items" not in channel_response or len(channel_response["items"]) == 0:
            logger.error(f"No channel found for ID: {channel_id}")
            return None
            
        channel = channel_response["items"][0]
        banner_url = None
        if "brandingSettings" in channel and "image" in channel["brandingSettings"]:
            banner_url = channel["brandingSettings"]["image"].get("bannerExternalUrl")
            
        return {
            "id": channel["id"],
            "title": channel["snippet"]["title"],
            "description": channel["snippet"].get("description", ""),
            "avatar_url": channel["snippet"]["thumbnails"]["default"]["url"],
            "banner_url": banner_url,
            "subscriber_count": int(channel["statistics"].get("subscriberCount", 0)) if "statistics" in channel else None,
            "youtube_channel_url": f"https://www.youtube.com/channel/{channel_id}"
        }
    except HttpError as e:
        logger.error(f"Error fetching channel data for video URL {video_url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching channel data for video URL {video_url}: {e}")
        return None

async def store_influencer_from_video(db: AsyncSession, video: Video) -> Tuple[Influencer, bool]:
    """Store or update influencer from video data if not already linked.
    
    Args:
        db: Database session
        video: Video object
        
    Returns:
        Tuple of (Influencer object, bool indicating if it's newly created)
    """
    try:
        # Check if video already has an influencer
        if video.influencer_id is not None:
            # Get the existing influencer
            result = await db.execute(
                select(Influencer).filter(Influencer.id == video.influencer_id)
            )
            influencer = result.scalars().first()
            if influencer:
                logger.info(f"Video {video.youtube_video_id} already linked to influencer {influencer.name}")
                return influencer, False
        
        # Get channel data from video URL
        channel_data = await get_channel_from_video_url(video.video_url)
        if not channel_data:
            logger.error(f"Could not retrieve channel data for video {video.youtube_video_id}")
            return None, False  # type: ignore
            
        # Check if influencer already exists by channel ID
        result = await db.execute(
            select(Influencer).filter(Influencer.youtube_channel_id == channel_data["id"])
        )
        influencer = result.scalars().first()
        
        if influencer:
            # Update existing influencer with latest data
            logger.info(f"Updating existing influencer {influencer.name} from video {video.youtube_video_id}")
            influencer.name = channel_data["title"]
            influencer.bio = channel_data["description"]
            influencer.avatar_url = channel_data["avatar_url"]
            influencer.banner_url = channel_data.get("banner_url")
            influencer.subscriber_count = channel_data.get("subscriber_count")
            
            # Link video to influencer if not already linked
            if video.influencer_id != influencer.id:
                video.influencer_id = influencer.id
                db.add(video)
                
            await db.flush()
            return influencer, False
        else:
            # Create new influencer
            logger.info(f"Creating new influencer from video {video.youtube_video_id}")
            new_influencer = Influencer(
                id=uuid.uuid4(),
                name=channel_data["title"],
                youtube_channel_id=channel_data["id"],
                youtube_channel_url=channel_data["youtube_channel_url"],
                bio=channel_data["description"],
                avatar_url=channel_data["avatar_url"],
                banner_url=channel_data.get("banner_url"),
                subscriber_count=channel_data.get("subscriber_count")
            )
            db.add(new_influencer)
            await db.flush()
            await db.refresh(new_influencer)
            
            # Link video to new influencer
            video.influencer_id = new_influencer.id
            db.add(video)
            await db.flush()
            
            return new_influencer, True
    except Exception as e:
        logger.error(f"Error storing influencer from video {video.youtube_video_id}: {e}")
        raise

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
                
                # Retrieve influencer data if not already linked
                if not video.influencer_id:
                    logger.info(f"No influencer linked to video {video.youtube_video_id}, retrieving channel data...")
                    influencer, is_new = await store_influencer_from_video(db, video)
                    if influencer:
                        logger.info(f"{'Created new' if is_new else 'Linked existing'} influencer {influencer.name} for video {video.youtube_video_id}")
                    else:
                        logger.warning(f"Could not retrieve influencer data for video {video.youtube_video_id}")

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
                return True  # Return success value
            except Exception as e:
                logger.error(f"Error processing video {video.youtube_video_id}: {e}")
                raise  # Let the transaction rollback automatically


async def transcription_nlp_pipeline(db: AsyncSession, video_ids: Optional[list] = None, job_id: Optional[uuid.UUID] = None):
    """Main pipeline to process videos with job tracking."""
    start_time = time.time()
    processed_videos = 0
    failed_videos = 0
    
    try:
        # Limit to 4-5 concurrent downloads to avoid rate limits
        semaphore = asyncio.Semaphore(5)  # Only 5 concurrent downloads

        # Select videos to process
        if video_ids:
            result = await db.execute(
                select(Video)
                .filter(Video.id.in_(video_ids))
                .options(selectinload(Video.influencer))
            )
        else:
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
        total_videos = len(videos)

        if not videos:
            logger.info("No videos to process")
            if job_id:
                result_data = {"message": "No videos to process", "total_videos": 0}
                job_data = JobUpdateRequest(result_data=json.dumps(result_data))
                await JobService.update_job(db, job_id, job_data)
            return {"message": "No videos to process", "total_videos": 0}

        logger.info(f"Selected {total_videos} videos for processing")
        
        # Initialize job tracking
        if job_id:
            await JobService.update_tracking_stats(db, job_id,
                queue_size=total_videos,
                items_in_progress=0,
                failed_items=0
            )
            await JobService.update_progress(db, job_id, 0, total_videos)

        async def process_with_semaphore(video):
            nonlocal processed_videos, failed_videos
            
            async with semaphore:
                try:
                    # Update heartbeat and check for cancellation
                    if job_id:
                        await JobService.update_heartbeat(db, job_id)
                        
                        # Check for cancellation
                        current_job = await JobService.get_job(db, job_id)
                        if current_job and current_job.cancellation_requested:
                            logger.info(f"Job {job_id} cancellation requested, stopping pipeline")
                            await JobService.cancel_job(db, job_id, "Pipeline cancelled by user request")
                            return None
                        
                        # Update items in progress
                        await JobService.update_progress(db, job_id, min(5, total_videos - processed_videos - failed_videos))
                    
                    await asyncio.sleep(1)  # Add 1-second delay between downloads
                    result = await process_video(video)
                    processed_videos += 1
                    
                    # Update progress and processing rate
                    if job_id:
                        elapsed_time = time.time() - start_time
                        processing_rate = processed_videos / (elapsed_time / 60) if elapsed_time > 0 else 0
                        
                        await JobService.update_progress(db, job_id, processed_videos + failed_videos, total_videos)
                        await JobService.update_tracking_stats(db, job_id,
                            processing_rate=processing_rate
                        )
                        
                        # Estimate completion time
                        if processing_rate > 0:
                            remaining_items = total_videos - processed_videos - failed_videos
                            estimated_minutes = remaining_items / processing_rate
                            estimated_completion = datetime.now() + timedelta(minutes=estimated_minutes)
                            job_data = JobUpdateRequest(estimated_completion_time=estimated_completion)
                            await JobService.update_job(db, job_id, job_data)
                    
                    # Return True for successful processing
                    return True
                    
                except Exception as e:
                    failed_videos += 1
                    if job_id:
                        await JobService.update_tracking_stats(db, job_id, failed_items=failed_videos)
                    logger.error(f"Error processing video {video.id}: {e}")
                    return e

        # Process videos concurrently
        tasks = [process_with_semaphore(video) for video in videos]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        successful = sum(1 for r in results if r is not None and not isinstance(r, Exception))
        failed = len(results) - successful

        logger.info(f"Transcription and NLP pipeline completed: {successful} successful, {failed} failed")
        
        # Final job update
        result_data = {
            "videos_processed": successful,
            "total_videos": total_videos,
            "failed_videos": failed,
            "processing_time_minutes": (time.time() - start_time) / 60,
            "concurrency_limit": 5
        }
        
        if job_id:
            job_data = JobUpdateRequest(result_data=json.dumps(result_data))
            await JobService.update_job(db, job_id, job_data)
            await JobService.update_tracking_stats(db, job_id, items_in_progress=0)
            
        return result_data
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
        if job_id:
            await JobService.update_tracking_stats(db, job_id, items_in_progress=0)
        
        # Return error information instead of raising
        return {
            "error": str(e),
            "message": "Error in transcription pipeline",
            "success": False
        }
    finally:
        await db.close()
        redis_client.delete(TRANSCRIPTION_NLP_LOCK)  # Ensure lock is released

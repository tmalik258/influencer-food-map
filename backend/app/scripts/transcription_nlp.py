import os
import json
import uuid
import asyncio
import yt_dlp
import whisper
import requests
import textwrap
import tempfile
import subprocess
from openai import OpenAI

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from googlemaps import Client as GoogleMapsClient
from googlemaps.exceptions import ApiError

from app.models import Video, Restaurant, Listing, Influencer, Tag, RestaurantTag
from app.config import GOOGLE_MAPS_API_KEY, OPENAI_API_KEY
from app.utils.logging import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize clients with custom HTTP settings
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Custom requests session for Google Maps with referer header
session = requests.Session()
session.headers.update({"referer": "http://localhost:8030"})  # Adjust for your domain
gmaps = GoogleMapsClient(key=GOOGLE_MAPS_API_KEY, requests_session=session)

# Base directory for audio downloads
AUDIO_BASE_DIR = "audios"

# Chunk size for transcription
CHUNK_SIZE = 3500


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


async def extract_entities(transcription: str) -> dict:
    """Split long transcription, send each part to GPT-4, and combine results."""
    loop = asyncio.get_event_loop()

    # Split into manageable chunks
    chunks = textwrap.wrap(
        transcription, CHUNK_SIZE, break_long_words=False, break_on_hyphens=False
    )
    results = []

    system_prompt ="""
    You are a food data extraction assistant. Your role is to analyze a transcript chunk from a food-focused YouTube video and extract precise, structured information about any food-related places mentioned. This includes any restaurant, food stall, farm, food producer, or culinary establishment clearly referenced in the transcript.

    Your objectives:
    - Accurately identify all food-related places in the transcript where sufficient detail is available.
    - For each place, extract well-defined structured data as per the schema provided.
    - If the restaurant or food place name appears to be phonetically transcribed, misspelled, or plausibly a variant of a known establishment, research or cross-reference and correct to the most likely accurate (official) name, provided you can do so with high confidence. Only perform this correction if you are reasonably certain of the true name; otherwise, extract the name as-is and reflect any uncertainty with an appropriate confidence score.

    # Steps

    1. Read the transcript chunk thoroughly.
    2. Identify all food-related places (such as restaurants, stalls, farms, or producers) that are mentioned with enough context to extract structured data.
    3. For each qualifying place:
        - Evaluate if the name appears misspelled, inaccurately transcribed, or phonetically approximated. Where possible, confidently determine and use the accurate, official name; otherwise, retain the transcript name.
        - Extract and organize the following fields:
            - **restaurant_name**: The (corrected) name of the place (string, or null if unclear, generic, or not provided).
            - **location**: An object containing:
                - **address**: Street address (if mentioned) or null.
                - **city**: City name (if determinable) or null.
                - **county**: County/region/province (if provided) or null.
                - **country**: Country (if determinable) or null.
            - **context**: Up to 4 notable or sentiment-rich direct quotes/lines from the transcript mentioning this place; preserve quotation marks for direct quotes. Use null if no such context exists.
            - **tags**: An array of descriptive tags about food, experience, or cuisine (examples: "BBQ", "vegan", "Michelin-starred"). Use an empty array if no tags apply.
            - **confidence_score**: A float from 0.0 to 1.0 reflecting your confidence in the correctness and completeness of extracted information, including name correction where applicable.
    4. If no valid food-related place can be extracted confidently based on the transcript, return a single empty JSON object: {}.
    5. If there are multiple qualifying places, return a JSON array where each entry matches the schema.
    6. Do not provide explanations, notes, or reasoning in your answer. All output must be strictly valid JSON, matching the schema exactly and containing nothing but the data.

    # Output Format

    - Return a single JSON array [] if no qualifying food-related place is found.
    - For one or more valid places, return a JSON array, each element formatted as:

    {
    "restaurant_name": "string or null",
    "location": {
        "address": "string or null",
        "city": "string or null",
        "county": "string or null",
        "country": "string or null"
    },
    "context": ["string", "..."] or null,
    "tags": ["tag1", "tag2", "..."],
    "confidence_score": float (0.0–1.0)
    }

    - Use null for missing fields, and [] for tags if none apply.
    - Always preserve quotation marks in context if the original line is a direct quote.
    - Do not include any non-JSON content, explanations, or commentary.
    - Strictly adhere to JSON syntax and schema.

    # Examples

    **Example 1**  
    Transcript:  
    "So today we're at Al Habib BBQ in Lahore, and the aroma here is just amazing. Honestly, this might be the juiciest chicken tikka I've had on this trip."

    Output:
    [
    {
        "restaurant_name": "Al Habib BBQ",
        "location": {
        "address": null,
        "city": "Lahore",
        "county": null,
        "country": "Pakistan"
        },
        "context": [
        "So today we're at Al Habib BBQ in Lahore.",
        "Honestly, this might be the juiciest chicken tikka I've had on this trip."
        ],
        "tags": ["BBQ", "chicken tikka", "Pakistani"],
        "confidence_score": 0.95
    }
    ]

    **Example 2**  
    Transcript:  
    "We've been walking along Nimmanhaemin Road, trying the best street food Chiang Mai has to offer."

    Output:
    []

    **Example 3**  
    Transcript:  
    "We started off at The Oyster Shed, then grabbed a sandwich at Bread Me Up, both located near the harbor in Portree on the Isle of Skye."

    Output:
    [
    {
        "restaurant_name": "The Oyster Shed",
        "location": {
        "address": null,
        "city": "Portree",
        "county": "Isle of Skye",
        "country": "United Kingdom"
        },
        "context": [
        "We started off at The Oyster Shed"
        ],
        "tags": ["seafood", "harbor"],
        "confidence_score": 0.85
    },
    {
        "restaurant_name": "Bread Me Up",
        "location": {
        "address": null,
        "city": "Portree",
        "county": "Isle of Skye",
        "country": "United Kingdom"
        },
        "context": [
        "Grabbed a sandwich at Bread Me Up"
        ],
        "tags": ["sandwich", "bakery"],
        "confidence_score": 0.8
    }
    ]

    **Example 4**  
    Transcript:  
    "And finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right—but the chef is famous for modern Korean tasting menus."

    Output:
    [
    {
        "restaurant_name": "JungSik",
        "location": {
        "address": null,
        "city": null,
        "county": null,
        "country": "South Korea"
        },
        "context": [
        "Finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right.",
        "The chef is famous for modern Korean tasting menus."
        ],
        "tags": ["modern Korean", "tasting menu"],
        "confidence_score": 0.85
    }
    ]

    # Notes
    - If you identify a probable misspelling or pronunciation variant, correct the name to its standard form only when confident, based on context and known restaurant/cuisine information.
    - Do not infer or hallucinate information. Output only what is supported by the transcript and, in the case of name corrections, is supported by clear evidence or external verification.
    - Return null for missing values and [] for tags if not applicable.
    - If multiple food places are present, return each as a separate object in the JSON array.
    - Responses must be strictly valid JSON, with no commentary or formatting outside the data schema.

    REMINDER: Your most important tasks are to: extract only what is clearly stated, correct obvious misspelled or phonetically transcribed names with high confidence, organize output in a strictly valid JSON schema as shown above, and include no commentary—return only the data.
    """

    async def process_chunk(chunk: str, index: int):
        user_prompt = f"""
        Chunk {index+1}/{len(chunks)}:
        {chunk}
        """
        try:
            response = await loop.run_in_executor(
                None,
                lambda: openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{ "role": "system", "content": system_prompt }, { "role": "user", "content": user_prompt}],
                ),
            )
            content = response.choices[0].message.content.strip()
            result = json.loads(content)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Chunk {index+1} processing failed: {e}")
            return []

    tasks = [process_chunk(chunk, idx) for idx, chunk in enumerate(chunks)]
    results = await asyncio.gather(*tasks)

    # Merge results (custom logic as needed)
    final_result = {
        "restaurants": [],
        "tags": set(),
        "contexts": [],
        "locations": [],
        "average_confidence": 0.0,
    }

    confidences = []

    for chunk_result in results:
        if not chunk_result:
            continue
        for entry in chunk_result:
            final_result["restaurants"].append(entry)
            confidences.append(entry.get("confidence_score", 0.0))
            final_result["tags"].update(entry.get("tags", []))
            if entry.get("context"):
                final_result["contexts"].extend(entry["context"])
            final_result["locations"].append(entry.get("location"))

    final_result["tags"] = list(final_result["tags"])
    if confidences:
        final_result["average_confidence"] = round(sum(confidences) / len(confidences), 4)

    # Return only if restaurants were found
    return final_result if final_result["restaurants"] else {}


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
                quotes=entities.get("context", {}).get("quotes", []),
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


async def process_video(db: AsyncSession, video: Video):
    """Process a single video: transcribe, extract entities, validate, and store."""
    try:
        logger.info(f"Processing video {video.youtube_video_id}")

        transcription = video.transcription or ""

        # If no transcription, download and transcribe
        if not video.transcription:
            logger.info(
                f"No transcription found for video {video.youtube_video_id}, downloading and transcribing..."
            )
            # Download and transcribe
            audio_path = await download_audio(video.video_url, video)
            transcription = await transcribe_video(audio_path)

            logger.info(
                f"Transcription completed for video {video.youtube_video_id}: {transcription[:255]}..."
            )

            # Update video with transcription
            video.transcription = transcription
            await db.commit()

        # Extract entities
        entities = await extract_entities(transcription)
        if not entities:
            logger.info(
                f"No restaurant entities found for video {video.youtube_video_id}"
            )
            return
        logger.info(
            f"Entities extracted for video {video.youtube_video_id}: {entities}"
        )

        # Validate with Google Maps
        validated = await validate_restaurant(entities)
        if not validated["valid"]:
            logger.info(f"No valid restaurant found for video {video.youtube_video_id}")
            return
        logger.info(
            f"Validated restaurant for video {video.youtube_video_id}: {validated}"
        )

        # Store restaurant, tags, and listing
        await store_restaurant_and_listing(db, video, entities, validated)

        logger.info(
            f"Stored restaurant, tags, and listing for video {video.youtube_video_id}"
        )
    except Exception as e:
        logger.error(f"Error processing video {video.youtube_video_id}: {e}")


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
        tasks = [asyncio.create_task(process_video(db, video)) for video in videos]
        await asyncio.gather(*tasks, return_exceptions=True)

        # for i, video in enumerate(videos):
        #     await process_video(db, video)
        #     await asyncio.sleep(2)

        logger.info("Transcription and NLP pipeline completed")
    except Exception as e:
        logger.error(f"Error in pipeline: {e}")
    finally:
        await db.close()

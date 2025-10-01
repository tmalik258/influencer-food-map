import json
import uuid
import redis
import time
from datetime import datetime, timedelta
from typing import Optional, Set
import requests

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import HttpRequest

from sqlalchemy.orm import Session

from app.models import Influencer, Video, JobStatus
from app.config import REDIS_URL, YOUTUBE_API_KEY, INFLUENCER_CHANNELS, SCRAPE_YOUTUBE_LOCK
from app.utils.logging import setup_logger
from app.services.jobs import JobService
from app.api_schema.jobs import JobUpdateRequest
# from app.utils.country_utils import normalize_region_to_country_info

# Setup logging
logger = setup_logger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# Custom HTTP client to add referer header
class CustomHttpRequest(HttpRequest):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.headers["referer"] = "http://localhost:8030"  # Adjust for your domain

def build_youtube_client():
    """Build YouTube API client with custom referer header."""
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, requestBuilder=CustomHttpRequest)

youtube = build_youtube_client()

def get_channel(channel_url: str) -> dict | None:
    """Extract channel ID and metadata from channel URL."""
    try:
        channel_handle = channel_url.split("/")[-1]
        # Fetch channel metadata including ID, title, description, thumbnail, and statistics
        response = youtube.channels().list(
            part="id,snippet,brandingSettings,statistics",
            forHandle=channel_handle
        ).execute()
        if "items" in response and len(response["items"]) > 0:
            channel = response["items"][0]
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
                "data": channel  # Include full channel data for debugging
            }
        
        # Fallback: Try fetching by username
        logger.info(f"Fallback: Trying username for {channel_url}")
        username = channel_handle.replace("@", "")
        response = youtube.channels().list(
            part="id,snippet,brandingSettings,statistics",
            forUsername=username
        ).execute()
        if "items" in response and len(response["items"]) > 0:
            channel = response["items"][0]
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
                "data": channel  # Include full channel data for debugging
            }
        
        # Fallback: Scrape channel page
        logger.info(f"Fallback: Scraping channel page for {channel_url}")
        try:
            response = requests.get(channel_url, timeout=5)
            if response.status_code == 200 and 'channelId":"' in response.text:
                channel_id = response.text.split('channelId":"')[1].split('"')[0]
                if channel_id.startswith("UC"):
                    return {
                        "id": channel_id,
                        "title": "",  # Fallback: no title from scraping
                        "description": "",
                        "avatar_url": None
                    }
        except requests.RequestException as e:
            logger.error(f"Error scraping channel page for {channel_url}: {e}")
        
        logger.error(f"No channel found for {channel_url}")
        return None
    except HttpError as e:
        logger.error(f"Error fetching channel ID for {channel_url}: {e}")
        return None

def get_video_metadata(video_id: str) -> dict | None:
    """Fetch metadata for a single video by video ID."""
    try:
        response = youtube.videos().list(
            part="snippet,contentDetails,statistics",
            id=video_id
        ).execute()
        
        if "items" not in response or len(response["items"]) == 0:
            logger.error(f"No video found for ID: {video_id}")
            return None
        
        video = response["items"][0]
        snippet = video["snippet"]
        
        return {
            "youtube_video_id": video_id,
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "published_at": snippet["publishedAt"],
            "channel_id": snippet["channelId"],
            "channel_title": snippet["channelTitle"]
        }
    except HttpError as e:
        logger.error(f"Error fetching video metadata for {video_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching video metadata for {video_id}: {e}")
        return None

def get_videos(channel_id: str, exclude_ids: Optional[Set[str]] = None) -> list[dict]:
    """Fetch videos from a channel's upload playlist, optionally excluding known IDs."""
    try:
        # Get the upload playlist ID
        response = youtube.channels().list(part="contentDetails,snippet", id=channel_id).execute()
        if "items" not in response or len(response["items"]) == 0:
            logger.error(f"No channel details for {channel_id}")
            return []
        
        playlist_id = response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        # Fetch videos from the playlist
        videos = []
        next_page_token = None
        while True:
            playlist_response = youtube.playlistItems().list(
                part="snippet",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token
            ).execute()
            
            for item in playlist_response["items"]:
                video = item["snippet"]
                video_id = video["resourceId"]["videoId"]
                # Skip if in exclude list
                if exclude_ids and video_id in exclude_ids:
                    continue
                videos.append({
                    "youtube_video_id": video_id,
                    "title": video["title"],
                    "description": video.get("description", ""),
                    "video_url": f"https://www.youtube.com/watch?v={video_id}",
                    "published_at": video["publishedAt"],
                })
            
            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break
        
        return videos
    except HttpError as e:
        logger.error(f"Error fetching videos for channel {channel_id}: {e}")
        return []

def store_influencer(db: Session, static_channel: dict, channel_data: dict) -> Influencer:
    """Store or update influencer in the database."""
    try:
        logger.info(f"Storing influencer: {static_channel['name']} with channel ID: {channel_data['id']}")
        influencer = db.query(Influencer).filter(Influencer.youtube_channel_id == channel_data['id']).first()
        if not influencer:
            # Get region from API or static data
            # raw_region = channel_data.get("data", {}).get("snippet", {}).get("country", None) or static_channel.get("region", None)
            # # Normalize region to country code and name
            # country_code, country_name = normalize_region_to_country_info(raw_region) if raw_region else (None, None)
            
            influencer = Influencer(
                id=uuid.uuid4(),
                name=channel_data["title"] or static_channel["name"],  # Prefer API title
                youtube_channel_id=channel_data["id"],
                youtube_channel_url=static_channel["url"],
                # region=raw_region,
                # country=country_name,
                bio=channel_data["description"],
                avatar_url=channel_data["avatar_url"],
                banner_url=channel_data.get("banner_url"),
                subscriber_count=channel_data.get("subscriber_count")
            )
            db.add(influencer)
            db.commit()
            db.refresh(influencer)
            logger.info(f"Influencer {static_channel['name']} stored successfully.")
        else:
            logger.info(f"Influencer {static_channel['name']} already exists, updating details.")
            # Get region from API or static data
            # raw_region = channel_data.get("data", {}).get("snippet", {}).get("country", None) or static_channel.get("region", None)
            # # Normalize region to country code and name
            # country_code, country_name = normalize_region_to_country_info(raw_region) if raw_region else (None, None)
            
            influencer.name = channel_data["title"] or static_channel["name"]
            influencer.bio = channel_data["description"]
            influencer.avatar_url = channel_data["avatar_url"]
            influencer.banner_url = channel_data.get("banner_url")
            influencer.subscriber_count = channel_data.get("subscriber_count")
            # influencer.region = raw_region
            # influencer.country = country_name
            db.commit()
            db.refresh(influencer)
        logger.info(f"Influencer {static_channel['name']} updated/stored successfully.")
        return influencer
    except Exception as e:
        logger.error(f"Error storing influencer {static_channel['name']}: {e}")
        db.rollback()
        raise

def store_videos(db: Session, videos: list[dict], influencer_id: uuid.UUID):
    """Store or update videos in the database."""
    try:
        for video in videos:
            existing_video = db.query(Video).filter(Video.youtube_video_id == video["youtube_video_id"]).first()
            if not existing_video:
                db.add(Video(
                    influencer_id=influencer_id,
                    youtube_video_id=video["youtube_video_id"],
                    title=video["title"],
                    description=video["description"],
                    video_url=video["video_url"],
                    published_at=datetime.strptime(video["published_at"], "%Y-%m-%dT%H:%M:%SZ"),
                ))
            else:
                existing_video.title = video["title"]
                existing_video.description = video["description"]
                existing_video.video_url = video["video_url"]
                existing_video.published_at = datetime.strptime(video["published_at"], "%Y-%m-%dT%H:%M:%SZ")
                db.merge(existing_video)
        db.commit()
    except Exception as e:
        logger.error(f"Error storing videos for influencer {influencer_id}: {e}")
        db.rollback()
        raise

def scrape_youtube(db: Session, job_id: Optional[uuid.UUID] = None):
    """Main function to scrape YouTube video metadata and store in Supabase with job tracking.
    Only new videos (not already in DB) are stored; if no videos exist yet, fetch all.
    """
    start_time = time.time()
    last_heartbeat = start_time
    total_channels = len(INFLUENCER_CHANNELS)
    processed_channels = 0
    total_videos_processed = 0
    failed_channels = 0
    
    try:
        # Initialize job tracking
        if job_id:
            JobService.update_tracking_stats_sync(db, job_id, 
                queue_size=total_channels,
                items_in_progress=0,
                failed_items=0
            )
            JobService.update_progress_sync(db, job_id, 0, total_channels)
        
        for i, channel in enumerate(INFLUENCER_CHANNELS):
            try:
                # Check for cancellation
                if job_id:
                    current_job = JobService.get_job_sync(db, job_id)
                    if current_job and current_job.cancellation_requested:
                        logger.info(f"Job {job_id} cancellation requested, stopping scraping")
                        JobService.cancel_job_sync(db, job_id, "Scraping cancelled by user request")
                        return {"cancelled": True, "processed_channels": processed_channels}
                
                logger.info(f"Processing channel {i+1}/{total_channels}: {channel['name']}")
                
                # Update heartbeat and progress
                if job_id:
                    current_time = time.time()
                    if current_time - last_heartbeat > 30:
                        JobService.update_heartbeat_sync(db, job_id)
                        last_heartbeat = current_time
                    
                    JobService.update_tracking_stats_sync(db, job_id,
                        items_in_progress=1,
                        queue_size=total_channels - processed_channels - 1
                    )
                
                channel_data: dict|None = get_channel(channel["url"])
                
                if not channel_data or "id" not in channel_data:
                    logger.error(f"Could not find channel ID for {channel['url']}")
                    failed_channels += 1
                    if job_id:
                        JobService.update_tracking_stats_sync(db, job_id, failed_items=failed_channels)
                    continue

                logger.info(f"Found channel ID: {channel_data['id']} for {channel['name']}")

                # Store influencer
                influencer = store_influencer(db, channel, channel_data)
                
                # Determine existing video IDs for this influencer
                existing_ids_rows = db.query(Video.youtube_video_id).filter(Video.influencer_id == influencer.id).all()
                existing_ids = {row[0] for row in existing_ids_rows}
                logger.info(f"Existing videos for influencer {influencer.id}: {len(existing_ids)}")
                
                # Fetch videos excluding existing ones (if any)
                videos = get_videos(channel_data["id"], exclude_ids=existing_ids if existing_ids else None)

                if not videos:
                    logger.info(f"No new videos found for channel {channel['name']} ({channel_data['id']})")
                    processed_channels += 1
                    if job_id:
                        JobService.update_progress_sync(db, job_id, processed_channels, total_channels)
                        JobService.update_tracking_stats_sync(db, job_id, items_in_progress=0)
                    continue

                logger.info(f"Found {len(videos)} NEW videos for channel {channel['name']} ({channel_data['id']})")

                store_videos(db, videos, influencer.id)
                total_videos_processed += len(videos)
                processed_channels += 1
                
                # Update progress and processing rate
                if job_id:
                    elapsed_time = time.time() - start_time
                    processing_rate = processed_channels / (elapsed_time / 60) if elapsed_time > 0 else 0
                    
                    JobService.update_progress_sync(db, job_id, processed_channels, total_channels)
                    JobService.update_tracking_stats_sync(db, job_id, 
                        items_in_progress=0,
                        processing_rate=processing_rate
                    )
                    
                    # Estimate completion time
                    if processing_rate > 0:
                        remaining_items = total_channels - processed_channels
                        estimated_minutes = remaining_items / processing_rate
                        estimated_completion = datetime.now() + timedelta(minutes=estimated_minutes)
                        JobService.update_job_sync(db, job_id, job_data=JobUpdateRequest(estimated_completion_time=estimated_completion))
                
            except Exception as channel_error:
                logger.error(f"Error processing channel {channel['name']}: {channel_error}")
                failed_channels += 1
                if job_id:
                    JobService.update_tracking_stats_sync(db, job_id, failed_items=failed_channels)
                continue

        logger.info(f"Scraping completed successfully. Processed {processed_channels}/{total_channels} channels, {total_videos_processed} total NEW videos, {failed_channels} failed channels")
        
        # Final job update
        if job_id:
            result_data = {
                "channels_processed": processed_channels,
                "total_channels": total_channels,
                "videos_processed": total_videos_processed,
                "failed_channels": failed_channels,
                "processing_time_minutes": (time.time() - start_time) / 60
            }
            job_data = JobUpdateRequest(
                result_data=json.dumps(result_data),
                status=JobStatus.COMPLETED,
                completed_at=datetime.now()
            )
            JobService.update_job_sync(db, job_id, job_data)
            
    except Exception as e:
        logger.error(f"Error in scraper: {e}")
        if job_id:
            JobService.update_tracking_stats_sync(db, job_id, items_in_progress=0)
        raise
    finally:
        db.close()
        redis_client.delete(SCRAPE_YOUTUBE_LOCK)

import json
import uuid
import redis
from datetime import datetime
import requests

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import HttpRequest

from sqlalchemy.orm import Session

from app.models import Influencer, Video
from app.config import REDIS_URL, YOUTUBE_API_KEY, INFLUENCER_CHANNELS, SCRAPE_YOUTUBE_LOCK
from app.utils.logging import setup_logger

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
        # Fetch channel metadata including ID, title, description, and thumbnail
        response = youtube.channels().list(
            part="id,snippet",
            forHandle=channel_handle
        ).execute()
        if "items" in response and len(response["items"]) > 0:
            channel = response["items"][0]
            return {
                "id": channel["id"],
                "title": channel["snippet"]["title"],
                "description": channel["snippet"].get("description", ""),
                "avatar_url": channel["snippet"]["thumbnails"]["default"]["url"],
                "data": channel  # Include full channel data for debugging
            }
        
        # Fallback: Try fetching by username
        logger.info(f"Fallback: Trying username for {channel_url}")
        username = channel_handle.replace("@", "")
        response = youtube.channels().list(
            part="id,snippet",
            forUsername=username
        ).execute()
        if "items" in response and len(response["items"]) > 0:
            channel = response["items"][0]
            return {
                "id": channel["id"],
                "title": channel["snippet"]["title"],
                "description": channel["snippet"].get("description", ""),
                "avatar_url": channel["snippet"]["thumbnails"]["default"]["url"],
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

def get_videos(channel_id: str) -> list[dict]:
    """Fetch videos from a channel's upload playlist."""
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
                videos.append({
                    "youtube_video_id": video["resourceId"]["videoId"],
                    "title": video["title"],
                    "description": video.get("description", ""),
                    "video_url": f"https://www.youtube.com/watch?v={video['resourceId']['videoId']}",
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
            influencer = Influencer(
                id=uuid.uuid4(),
                name=channel_data["title"] or static_channel["name"],  # Prefer API title
                youtube_channel_id=channel_data["id"],
                youtube_channel_url=static_channel["url"],
                region=channel_data.get("data", {}).get("snippet", {}).get("country", None) or static_channel.get("region", None),
                bio=channel_data["description"],
                avatar_url=channel_data["avatar_url"]
            )
            db.add(influencer)
            db.commit()
            db.refresh(influencer)
            logger.info(f"Influencer {static_channel['name']} stored successfully.")
        else:
            logger.info(f"Influencer {static_channel['name']} already exists, updating details.")
            influencer.name = channel_data["title"] or static_channel["name"]
            influencer.bio = channel_data["description"]
            influencer.avatar_url = channel_data["avatar_url"]
            influencer.region = channel_data.get("data", {}).get("snippet", {}).get("country", None) or static_channel.get("region", None)
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

def scrape_youtube(db: Session):
    """Main function to scrape YouTube video metadata and store in Supabase."""
    try:
        for channel in INFLUENCER_CHANNELS:
            logger.info(f"Processing channel: {channel['name']}")
            channel_data: dict|None = get_channel(channel["url"])
            if not channel_data or "id" not in channel_data:
                logger.error(f"Could not find channel ID for {channel['url']}")
                continue

            logger.info(f"Found channel ID: {channel_data['id']} for {channel['name']}")

            # break # Temporarily disable scraping for testing

            # Store influencer
            influencer = store_influencer(db, channel, channel_data)

            # continue # Temporarily disable scraping for testing
            
            # Fetch and store videos
            videos = get_videos(channel_data["id"])

            if not videos:
                logger.warning(f"No videos found for channel {channel['name']} ({channel_data['id']})")
                continue

            logger.info(f"Found {len(videos)} videos for channel {channel['name']} ({channel_data['id']}): {json.dumps(videos, indent=2)[:1000]}...")  # Log first 500 chars of video data

            # continue # Temporarily disable scraping for testing

            store_videos(db, videos, influencer.id)

        logger.info("Scraping completed successfully")
    except Exception as e:
        logger.error(f"Error in scraper: {e}")
    finally:
        db.close()
        redis_client.delete(SCRAPE_YOUTUBE_LOCK)

import pytest
from dotenv import load_dotenv
import re
from googleapiclient.discovery import build
from app.config import YOUTUBE_API_KEY, INFLUENCER_CHANNELS
from app.utils.logging import setup_logger

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = setup_logger(__name__)

def get_channel_id_from_url(url):
    """
    Extract channel ID from YouTube URL.
    Handles both @username and channel ID formats.
    """
    # Extract username from @username format
    username_match = re.search(r'@([^/?]+)', url)
    if username_match:
        return username_match.group(1)
    
    # Extract channel ID from channel URL format
    channel_match = re.search(r'/channel/([^/?]+)', url)
    if channel_match:
        return channel_match.group(1)
    
    return None

def get_channel_data_by_username(youtube, username):
    """
    Get channel data using username (handle).
    """
    try:
        # First try to search for the channel by username
        search_response = youtube.search().list(
            part='snippet',
            q=username,
            type='channel',
            maxResults=1
        ).execute()
        
        if search_response['items']:
            channel_id = search_response['items'][0]['snippet']['channelId']
            
            # Get detailed channel information
            channel_response = youtube.channels().list(
                part='snippet,statistics',
                id=channel_id
            ).execute()
            
            return channel_response
        
        return None
    except Exception as e:
        logger.error(f"Error fetching channel data for username {username}: {e}")
        return None

def test_youtube_api_fetch():
    """Test fetching real data from YouTube API using configured channels."""
    assert YOUTUBE_API_KEY is not None, "YOUTUBE_API_KEY not found in .env file"
    assert len(INFLUENCER_CHANNELS) > 0, "No influencer channels configured"

    logger.info(f"Using YouTube API Key: {YOUTUBE_API_KEY[:10]}...")

    # Use the first configured channel for testing
    test_channel = INFLUENCER_CHANNELS[0]
    channel_url = test_channel['url']
    channel_name = test_channel['name']
    
    logger.info(f"Testing with channel: {channel_name} ({channel_url})")

    # Build YouTube API client
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    # Extract username from URL
    username = get_channel_id_from_url(channel_url)
    assert username is not None, f"Could not extract username from URL: {channel_url}"
    
    logger.info(f"Extracted username: {username}")
    
    # Fetch channel data
    response = get_channel_data_by_username(youtube, username)
    
    # Validate response
    assert response is not None, f"Failed to fetch data for channel: {channel_name}"
    assert 'items' in response, "Response missing 'items' field"
    assert len(response['items']) > 0, "No channel data returned"
    
    channel_data = response['items'][0]
    
    # Validate channel data structure
    assert 'id' in channel_data, "Channel data missing 'id' field"
    assert 'snippet' in channel_data, "Channel data missing 'snippet' field"
    assert 'statistics' in channel_data, "Channel data missing 'statistics' field"
    
    # Validate snippet data
    snippet = channel_data['snippet']
    assert 'title' in snippet, "Channel snippet missing 'title' field"
    assert 'description' in snippet, "Channel snippet missing 'description' field"
    
    # Validate statistics data
    statistics = channel_data['statistics']
    assert 'subscriberCount' in statistics, "Channel statistics missing 'subscriberCount' field"
    assert 'videoCount' in statistics, "Channel statistics missing 'videoCount' field"
    
    logger.info(f"Successfully retrieved data for channel: {snippet['title']}")
    logger.info(f"Subscriber count: {statistics.get('subscriberCount', 'Hidden')}")
    logger.info(f"Video count: {statistics['videoCount']}")
    
    # Log the full response for debugging
    logger.info(f"Retrieved YouTube API Data: {response}")

def test_multiple_channels():
    """Test fetching data from multiple configured channels."""
    assert YOUTUBE_API_KEY is not None, "YOUTUBE_API_KEY not found in .env file"
    
    # Build YouTube API client
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    # Test first 3 channels to avoid hitting API quotas
    test_channels = INFLUENCER_CHANNELS[:3]
    successful_fetches = 0
    
    for channel in test_channels:
        channel_url = channel['url']
        channel_name = channel['name']
        
        logger.info(f"Testing channel: {channel_name}")
        
        username = get_channel_id_from_url(channel_url)
        if username:
            response = get_channel_data_by_username(youtube, username)
            if response and response.get('items'):
                successful_fetches += 1
                logger.info(f"✓ Successfully fetched data for: {channel_name}")
            else:
                logger.warning(f"✗ Failed to fetch data for: {channel_name}")
        else:
            logger.warning(f"✗ Could not extract username from URL: {channel_url}")
    
    # At least one channel should be successfully fetched
    assert successful_fetches > 0, "Failed to fetch data from any configured channels"

# To run this test, save it as test_youtube_api.py in your tests directory
# and run pytest from your terminal: pytest backend/tests/test_youtube_api.py
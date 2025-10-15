import asyncio
import logging
import sys
import os

# Configure logging to see all output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Add the app directory to the Python path
sys.path.insert(0, '/code')

from app.services.transcription_nlp import download_audio

class MockInfluencer:
    def __init__(self):
        self.name = "Test Influencer"
        self.bio = "Test bio"
        self.avatar_url = "https://example.com/avatar.jpg"
        self.banner_url = "https://example.com/banner.jpg"
        self.youtube_channel_id = "UCtest123"
        self.youtube_channel_url = "https://youtube.com/channel/UCtest123"
        self.subscriber_count = 1000

class MockVideo:
    def __init__(self):
        self.id = 1
        self.youtube_video_id = "4XEoZ2KI3FM"  # This video triggers bot detection
        self.influencer_id = 1
        self.title = "Test Video"
        self.description = "Test description"
        self.video_url = "https://www.youtube.com/watch?v=4XEoZ2KI3FM"
        self.published_at = "2023-01-01T00:00:00Z"
        self.transcription = None
        self.is_processed = False
        self.influencer = MockInfluencer()

async def test_fallback():
    print("=== STARTING FALLBACK TEST ===")
    video = MockVideo()
    video_url = video.video_url
    
    try:
        result = await download_audio(video_url, video)
        print(f"SUCCESS: Downloaded audio to {result}")
    except Exception as e:
        print(f"FAILED: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    asyncio.run(test_fallback())
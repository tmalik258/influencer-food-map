import os
from dotenv import load_dotenv

load_dotenv()

# configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", None)
ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL", None)

# Redis lock keys
SCRAPE_YOUTUBE_LOCK = "lock:scrape_youtube"
TRANSCRIPTION_NLP_LOCK = "lock:transcription_nlp"

# supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

# admin
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# API KEYS
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# Influencer channels
INFLUENCER_CHANNELS = [
    {"url": "https://www.youtube.com/@alexandertheguest", "name": "Alexander The Guest", "region": None},
    {"url": "https://www.youtube.com/@thefoodranger", "name": "The Food Ranger", "region": "Canada"},
    {"url": "https://www.youtube.com/@OneBitePizzaReviews", "name": "One Bite Pizza Reviews", "region": "USA"},
    {"url": "https://www.youtube.com/@ligier", "name": "Ligier", "region": None},
    {"url": "https://www.youtube.com/@MarkWiens", "name": "Mark Wiens", "region": "Thailand"},
    {"url": "https://www.youtube.com/@AnthonyBourdainPartsUnknown", "name": "Anthony Bourdain Parts Unknown", "region": "USA"},
    {"url": "https://www.youtube.com/@eatingwithtod", "name": "Eating with Tod", "region": None},
    {"url": "https://www.youtube.com/@HarrisonWebb97", "name": "Harrison Webb", "region": None},
    {"url": "https://www.youtube.com/@BestEverFoodReviewShow", "name": "Best Ever Food Review Show", "region": "Vietnam"},
    {"url": "https://www.youtube.com/@strictlydumpling", "name": "Strictly Dumpling", "region": "USA"},
    {"url": "https://www.youtube.com/@andersandkaitlin", "name": "Anders and Kaitlin", "region": "Nordic"},
    {"url": "https://www.youtube.com/@S3Lifestyle", "name": "S3 Lifestyle", "region": None},
    {"url": "https://www.youtube.com/@Journeys007", "name": "Journeys007", "region": None},
]

# Entities Extractor
CHUNK_SIZE = 4000 # Chunk size for transcription
TOKEN_SIZE = 4500

# Base directory for audio downloads
AUDIO_BASE_DIR = "audios"

# yt-dlp cookie/auth config (optional)
YTDLP_COOKIES_FILE = os.getenv("YTDLP_COOKIES_FILE")  # path to cookies.txt
YTDLP_COOKIES_FROM_BROWSER = os.getenv("YTDLP_COOKIES_FROM_BROWSER", "chrome")  # e.g., "chrome", "edge"
YTDLP_BROWSER_PROFILE = os.getenv("YTDLP_BROWSER_PROFILE", "Default")  # optional profile name/id
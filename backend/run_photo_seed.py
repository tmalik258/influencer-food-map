#!/usr/bin/env python3
"""
Script to populate restaurant photos from Google Places API

Usage:
    python run_photo_seed.py

Make sure to set GOOGLE_PLACES_API_KEY in your .env file before running.
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import and run the seed function
from app.seeds.populate_restaurant_photos import populate_restaurant_photos
import asyncio

if __name__ == "__main__":
    print("Restaurant Photo Seeder")
    print("======================\n")
    
    # Check if API key is set
    if not os.getenv("GOOGLE_PLACES_API_KEY"):
        print("❌ Error: GOOGLE_PLACES_API_KEY not found in environment variables.")
        print("Please add your Google Places API key to the .env file:")
        print("GOOGLE_PLACES_API_KEY=your_api_key_here\n")
        sys.exit(1)
    
    print("✅ Google Places API key found.")
    print("Starting photo population process...\n")
    
    try:
        asyncio.run(populate_restaurant_photos())
        print("\n🎉 Photo population completed successfully!")
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
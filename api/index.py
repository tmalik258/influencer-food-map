"""
Main API entry point for Vercel serverless deployment.
This serves the FastAPI application as a Vercel serverless function.
"""

import sys
import os
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Ensure backend app path is available
sys.path.insert(0, str(backend_path / "app"))

try:
    # Try importing from backend.app structure
    from backend.app.main import app
except ImportError:
    try:
        # Fallback: try direct app import
        from app.main import app
    except ImportError:
        # Last resort: add current directory and try again
        sys.path.insert(0, os.path.dirname(__file__))
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
        from backend.app.main import app

# This is what Vercel will use
handler = app

# For compatibility
application = app

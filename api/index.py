"""
Main API entry point for Vercel serverless deployment.
This file serves as the entry point for all API routes.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Set environment variables for the application
os.environ.setdefault('PYTHONPATH', '/var/task')

try:
    # Import the FastAPI app from the backend
    from backend.app.main import app
except ImportError:
    # Fallback import in case the path structure is different in Vercel
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
    from app.main import app

# Export the app for Vercel
app = app

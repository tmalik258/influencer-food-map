"""
Restaurants API endpoint for Vercel serverless deployment
"""

import sys
import os
from pathlib import Path
import json
from urllib.parse import parse_qs

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(backend_path / "app"))

try:
    # Import required modules
    from backend.app.routes.restaurants import router as restaurants_router
    from backend.app.database import get_database
    from backend.app.api_schema.restaurants import RestaurantResponse
    import asyncio
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback for missing dependencies
    pass

from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()

            # Parse query parameters
            query = parse_qs(self.path.split('?')[1] if '?' in self.path else '')
            
            response = {
                "message": "Restaurants API endpoint",
                "status": "success",
                "data": [],
                "query": query
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                "message": "Internal server error",
                "status": "error",
                "error": str(e)
            }
            
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

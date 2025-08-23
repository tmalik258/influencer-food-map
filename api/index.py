"""
Main API entry point for Vercel serverless deployment
"""

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "Influencer Food Map API",
            "status": "success",
            "version": "1.0.0",
            "endpoints": {
                "restaurants": "/api/restaurants",
                "influencers": "/api/influencers",
                "listings": "/api/listings",
                "test": "/api/test"
            }
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

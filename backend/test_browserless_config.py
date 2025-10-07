#!/usr/bin/env python3
"""
Test script to verify Browserless configuration and integration
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_configuration():
    """Test configuration loading"""
    print("=== Testing Configuration Loading ===")
    
    try:
        # Test basic configuration
        from app.config import (
            BROWSERLESS_WS_URL, 
            BROWSERLESS_TOKEN, 
            PRODUCTION_BROWSER_ARGS, 
            SECURITY_HEADERS
        )
        
        print("✓ Configuration loaded successfully")
        print(f"  BROWSERLESS_WS_URL: {BROWSERLESS_WS_URL}")
        print(f"  BROWSERLESS_TOKEN: {'***' if BROWSERLESS_TOKEN else 'Not set'}")
        print(f"  PRODUCTION_BROWSER_ARGS: {len(PRODUCTION_BROWSER_ARGS)} args configured")
        print(f"  SECURITY_HEADERS: {len(SECURITY_HEADERS)} headers configured")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False

def test_browserless_integration():
    """Test Browserless integration functions"""
    print("\n=== Testing Browserless Integration ===")
    
    try:
        from app.utils.youtube_cookies import (
            get_browserless_ws_url, 
            test_browserless_connection,
            create_secure_browser_context
        )
        
        print("✓ Browserless integration functions imported successfully")
        
        # Test WebSocket URL formatting
        ws_url = get_browserless_ws_url()
        print(f"  Formatted WebSocket URL: {ws_url}")
        
        # Test connection (this might fail if Browserless is not running, which is expected in local dev)
        print("  Testing Browserless connection...")
        try:
            connection_test = test_browserless_connection()
            print(f"  Connection test result: {connection_test}")
        except Exception as conn_error:
            print(f"  Connection test failed (expected in local dev): {conn_error}")
        
        return True
        
    except Exception as e:
        print(f"✗ Browserless integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_stealth_configurations():
    """Test stealth configuration elements"""
    print("\n=== Testing Stealth Configurations ===")
    
    try:
        from app.config import PRODUCTION_BROWSER_ARGS, SECURITY_HEADERS
        
        # Check for key security arguments
        security_args_check = {
            '--disable-blink-features=AutomationControlled': False,
            '--disable-dev-shm-usage': False,
            '--no-sandbox': False,
            '--disable-setuid-sandbox': False,
            '--disable-web-security': False,
            '--disable-features=IsolateOrigins,site-per-process': False
        }
        
        for arg in PRODUCTION_BROWSER_ARGS:
            for
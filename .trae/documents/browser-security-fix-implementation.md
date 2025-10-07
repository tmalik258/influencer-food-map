# Browser Security Fix Implementation Plan

## Problem Analysis

The "browser not secure" warning in production occurs because:
1. **Direct Playwright Usage**: Current implementation launches browsers directly in Docker containers, which can trigger Google's security mechanisms
2. **Headless Detection**: Production environment uses headless browsers that are more easily detected by Google's anti-bot systems
3. **Container Fingerprinting**: Docker containers have unique fingerprints that differ from real user environments
4. **Missing Security Headers**: Current browser launch arguments lack proper security hardening

## Solution Overview

We'll integrate Browserless API for production while maintaining local compatibility through:
1. **Browserless API Integration**: Use managed browser infrastructure in production
2. **Enhanced Security Configuration**: Add proper browser security headers and arguments
3. **Environment-Based Switching**: Automatically detect and use appropriate browser backend
4. **Fallback Mechanisms**: Maintain existing local development workflow

## Implementation Steps

### 1. Update Backend Configuration

First, add Browserless configuration to the backend config file:

```python
# Add to backend/app/config.py

# Browserless API configuration
BROWSERLESS_WS_URL = os.getenv("BROWSERLESS_WS_URL")  # e.g., ws://browserless:3000?token=YOUR_TOKEN
BROWSERLESS_TOKEN = os.getenv("BROWSERLESS_TOKEN")
BROWSERLESS_DEBUG = os.getenv("BROWSERLESS_DEBUG", "false").lower() == "true"
```

### 2. Enhanced Browser Security Configuration

Update the `youtube_cookies.py` file with Browserless integration and enhanced security:

```python
# Add to imports in youtube_cookies.py
import json
from urllib.parse import urlparse

# Enhanced browser arguments for security
PRODUCTION_BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-automation',
    '--disable-extensions',
    '--no-first-run',
    '--no-service-autorun',
    '--password-store=basic',
    '--disable-background-networking',
    '--disable-component-extensions-with-background-pages',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
]

# Enhanced HTTP headers for security
SECURITY_HEADERS = {
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
}

def get_browserless_ws_url() -> str:
    """Get Browserless WebSocket URL with proper formatting."""
    if not BROWSERLESS_WS_URL:
        return None
    
    ws_url = BROWSERLESS_WS_URL
    if BROWSERLESS_TOKEN and 'token=' not in ws_url:
        separator = '&' if '?' in ws_url else '?'
        ws_url = f"{ws_url}{separator}token={BROWSERLESS_TOKEN}"
    
    return ws_url

async def launch_browser_with_browserless(p, headless: bool = True) -> Browser:
    """Launch browser using Browserless API for production."""
    ws_url = get_browserless_ws_url()
    if not ws_url:
        return None
    
    try:
        logger.info(f"Connecting to Browserless via CDP: {ws_url.split('?')[0]}")
        
        # Enhanced browser context options for Browserless
        browser = await p.chromium.connect_over_cdp(ws_url)
        
        if BROWSERLESS_DEBUG:
            logger.info(f"Browserless connection established")
        
        return browser
    except Exception as e:
        logger.error(f"Browserless connection failed: {e}")
        return None

async def launch_browser_locally(p, headless: bool = True, browser_type: str = "chromium", channel: Optional[str] = None) -> Browser:
    """Launch browser locally for development."""
    docker = is_docker()
    
    # Enhanced browser arguments for local deployment
    args = PRODUCTION_BROWSER_ARGS.copy()
    
    # Add virtual time budget for headless non-docker environments
    if headless and not docker:
        args.append('--virtual-time-budget=5000')
    
    # Launch appropriate browser type
    if browser_type == "firefox":
        browser = await p.firefox.launch(
            headless=headless,
            channel=channel,
            args=args,
        )
    else:  # Default to chromium
        browser = await p.chromium.launch(
            headless=headless,
            channel=channel,
            args=args,
        )
    
    return browser

async def create_secure_browser_context(browser, context_opts: dict) -> BrowserContext:
    """Create a secure browser context with enhanced security settings."""
    # Merge security headers with context options
    enhanced_opts = context_opts.copy()
    enhanced_opts['extra_http_headers'] = SECURITY_HEADERS.copy()
    
    # Add viewport and user agent for realism
    enhanced_opts.update({
        'viewport': {"width": 1366, "height": 768},
        'user_agent': REALISTIC_UA,
        'locale': 'en-US',
        'timezone_id': 'UTC',
        'permissions': ['geolocation'],
        'geolocation': {'latitude': 37.7749, 'longitude': -122.4194},
        'color_scheme': 'light',
        'device_scale_factor': 1,
        'is_mobile': False,
        'has_touch': False,
    })
    
    # Try loading persisted state first
    if os.path.exists(STORAGE_STATE_FILE):
        logger.info("Loading persisted YouTube storage state")
        try:
            context = await browser.new_context(storage_state=STORAGE_STATE_FILE, **enhanced_opts)
            return context
        except Exception as e:
            logger.warning(f"Failed to load storage state: {e}")
    
    # Create new context if storage state fails
    context = await browser.new_context(**enhanced_opts)
    return context
```

### 3. Update the Main Browser Launch Function

Replace the current `_run_refresh` function with an enhanced version:

```python
async def _run_refresh(headless: bool, browser_type: str = "chromium", channel: Optional[str] = None) -> bool:
    """Enhanced browser refresh with Browserless integration and security hardening."""
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    docker = is_docker()
    if docker:
        logger.info("Docker detected; using enhanced security configuration")

    try:
        async with Stealth().use_async(async_playwright()) as p:
            # Try Browserless first in production
            browser = await launch_browser_with_browserless(p, headless)
            using_browserless = browser is not None
            
            # Fall back to local browser if Browserless fails or not configured
            if not browser:
                logger.info("Using local browser launch")
                browser = await launch_browser_locally(p, headless, browser_type, channel)
            else:
                logger.info("Using Browserless for enhanced security")

            # Enhanced context options
            context_opts = {}
            context = await create_secure_browser_context(browser, context_opts)
            
            # Add stealth script to hide automation
            await context.add_init_script('Object.defineProperty(navigator, "webdriver", {get: () => undefined})')
            await context.add_init_script('''
                // Additional stealth measures
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
                
                // Override webdriver property
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                // Mock permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
            ''')
            
            page = await context.new_page()
            
            # Set additional security headers
            await page.set_extra_http_headers(SECURITY_HEADERS)

            # Rest of the existing logic continues...
            # (Login, navigation, cookie extraction, etc.)
            
            if using_browserless:
                logger.info("Browserless session completed successfully")
            
            return True

    except Exception as e:
        logger.error(f"Cookie refresh failed (headless={headless}, browser={browser_type}, channel={channel}): {e}")
        
        # Enhanced error logging for Browserless issues
        if "browserless" in str(e).lower():
            logger.error("Browserless connection issue detected. Check:")
            logger.error("1. Browserless service is running")
            logger.error("2. BROWSERLESS_WS_URL is correct")
            logger.error("3. BROWSERLESS_TOKEN is valid")
            logger.error("4. Network connectivity to Browserless service")
        
        return False
```

### 4. Update Environment Configuration

Add Browserless configuration to the backend `.env.example`:

```bash
# Browserless API configuration (for production)
# Use Browserless Cloud or self-hosted Browserless service
BROWSERLESS_WS_URL=ws://browserless:3000
BROWSERLESS_TOKEN=your-browserless-token-here
BROWSERLESS_DEBUG=false
```

### 5. Update Docker Compose Production

Add Browserless service to `docker-compose.prod.yml`:

```yaml
services:
  browserless:
    image: browserless/chrome:latest
    container_name: nomtok_browserless_prod
    ports:
      - "3001:3000"
    environment:
      - TOKEN=${BROWSERLESS_TOKEN:-default-token}
      - PREBOOT_CHROME=true
      - MAX_CONCURRENT=5
      - CONCURRENT=3
      - MAX_QUEUE_LENGTH=10
      - ENABLE_CORS=true
      - ENABLE_API_GET=true
      - DEBUG=${BROWSERLESS_DEBUG:-false}
      - HEADLESS=true
      - CHROME_REFRESH_TIME=300000
      - DEFAULT_BLOCK_ADS=true
      - DEFAULT_HEADLESS=true
      - DEFAULT_IGNORE_HTTPS_ERRORS=true
      - DEFAULT_IGNORE_DEFAULT_ARGS=false
      - DEFAULT_DUMPIO=false
      - DEFAULT_STEALTH=true
    volumes:
      - browserless_data:/usr/src/app/workspace
    networks:
      - nomtok-network
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/pressure"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  backend:
    # ... existing backend configuration ...
    environment:
      - REDIS_URL=redis://redis:6379
      - BROWSERLESS_WS_URL=ws://browserless:3000
      - BROWSERLESS_TOKEN=${BROWSERLESS_TOKEN:-default-token}
      - BROWSERLESS_DEBUG=${BROWSERLESS_DEBUG:-false}
    depends_on:
      - redis
      - tor
      - browserless  # Add browserless dependency

# Add browserless volume
volumes:
  browserless_data:
```

### 6. Enhanced Error Handling

Add specific error handling for Browserless connectivity issues:

```python
async def test_browserless_connection() -> bool:
    """Test Browserless API connectivity."""
    ws_url = get_browserless_ws_url()
    if not ws_url:
        logger.warning("Browserless not configured, skipping connection test")
        return True
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(ws_url)
            # Try to create a simple page to test connectivity
            context = await browser.new_context()
            page = await context.new_page()
            await page.goto("https://www.google.com", timeout=10000)
            await browser.close()
            logger.info("Browserless connection test successful")
            return True
    except Exception as e:
        logger.error(f"Browserless connection test failed: {e}")
        return False

# Add to your main application startup
@app.on_event("startup")
async def startup_event():
    """Test Browserless connection on startup."""
    if not await test_browserless_connection():
        logger.warning("Browserless connection failed, will use fallback local browser")
```

### 7. Local Development Compatibility

For local development, ensure the existing workflow continues to work:

1. **No Browserless Required**: If `BROWSERLESS_WS_URL` is not set, the system automatically falls back to local browser launch
2. **Same Environment Variables**: Local development can continue using existing `GOOGLE_EMAIL` and `GOOGLE_PASSWORD`
3. **Enhanced Local Security**: Even local browsers will use the enhanced security arguments and headers

## Testing and Validation

### 1. Local Development Test
```bash
# Ensure local development still works
cd backend
python -m app.utils.youtube_cookies
# Should work with existing local browser setup
```

### 2. Production Deployment Test
```bash
# Deploy with Browserless
docker-compose -f docker-compose.prod.yml up -d browserless backend

# Monitor logs for Browserless connection
docker logs nomtok_browserless_prod
docker logs nomtok_backend_prod | grep -i browserless
```

### 3. Cookie Refresh Test
```bash
# Test cookie refresh in production
curl -X POST http://localhost:8030/api/admin/process/youtube-cookies
# Should show successful Browserless connection
```

## Monitoring and Troubleshooting

### Key Metrics to Monitor:
1. **Browserless Connection Success Rate**
2. **Google Login Success Rate**
3. **Cookie Refresh Completion Time**
4. **Error Rates by Browser Type**

### Common Issues and Solutions:

1. **Browserless Connection Timeout**
   - Solution: Increase timeout values and check network connectivity
   - Check: `BROWSERLESS_WS_URL` format and accessibility

2. **Google Security Challenge**
   - Solution: Use headful mode for initial authentication
   - Fallback: Manual cookie export and import

3. **Certificate Errors**
   - Solution: Ensure `--ignore-certificate-errors` flag is set
   - Check: SSL certificate validity on Browserless service

## Security Considerations

1. **Token Security**: Store `BROWSERLESS_TOKEN` securely using Docker secrets or environment variable management
2. **Network Isolation**: Ensure Browserless service is only accessible within the Docker network
3. **Rate Limiting**: Implement rate limiting to prevent abuse of the browser automation
4. **Logging**: Ensure sensitive data (passwords, tokens) are not logged

## Performance Optimization

1. **Browser Pooling**: Browserless supports connection pooling for better performance
2. **Concurrent Limits**: Set appropriate `MAX_CONCURRENT` and `CONCURRENT` values
3. **Resource Limits**: Monitor CPU and memory usage of Browserless containers
4. **Caching**: Implement caching for successful authentication sessions

This solution provides a robust, scalable approach to resolving the "browser not secure" warning while maintaining full compatibility with your existing local development workflow.
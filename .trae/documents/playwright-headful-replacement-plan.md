# Playwright Headful Mode Implementation Plan

## Overview
This plan details the replacement of the current Browserless API implementation with standard Playwright library running in headful mode with enhanced stealth settings to avoid detection mechanisms while maintaining all existing capabilities.

## Current State Analysis

### Existing Implementation
- Uses Browserless API for production via WebSocket CDP connection
- Falls back to local browser launch for development
- Includes comprehensive stealth configurations
- Supports multiple browser types (Chromium, Chrome, Firefox)
- Has environment-based switching logic

### Issues to Address
1. Remove Browserless API dependency
2. Configure headful mode as primary option
3. Maintain all existing stealth capabilities
4. Ensure proper Docker compatibility
5. Preserve fallback mechanisms

## Implementation Strategy

### Phase 1: Configuration Updates

#### 1.1 Update Backend Configuration
Remove Browserless-specific configuration and add headful mode settings:

```python
# backend/app/config.py - Remove Browserless config
# Remove these lines:
# BROWSERLESS_WS_URL = os.getenv("BROWSERLESS_WS_URL")
# BROWSERLESS_TOKEN = os.getenv("BROWSERLESS_TOKEN") 
# BROWSERLESS_DEBUG = os.getenv("BROWSERLESS_DEBUG", "false").lower() == "true"

# Add headful mode configuration
HEADFUL_MODE = os.getenv("HEADFUL_MODE", "true").lower() == "true"
HEADFUL_DISPLAY = os.getenv("HEADFUL_DISPLAY", ":99")  # For Xvfb in Docker
```

#### 1.2 Update Environment Variables
Modify `.env.example` and production environment files:

```bash
# Remove Browserless variables
# BROWSERLESS_WS_URL=ws://browserless:3000
# BROWSERLESS_TOKEN=your_token_here
# BROWSERLESS_DEBUG=false

# Add headful mode variables
HEADFUL_MODE=true
HEADFUL_DISPLAY=:99
```

### Phase 2: Core Implementation Changes

#### 2.1 Refactor Browser Launch Logic
Replace the current `_run_refresh` function in `youtube_cookies.py`:

```python
async def _run_refresh(headless: bool, browser_type: str = "chromium", channel: Optional[str] = None) -> bool:
    """Enhanced browser refresh with headful mode and stealth settings."""
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    docker = is_docker()
    if docker:
        logger.info("Docker detected; configuring for headful mode with Xvfb")
        # Set up Xvfb for headful mode in Docker
        os.environ['DISPLAY'] = HEADFUL_DISPLAY
    else:
        logger.info("Local environment detected; using native headful mode")

    try:
        async with Stealth().use_async(async_playwright()) as p:
            # Enhanced browser arguments for headful stealth mode
            args = get_enhanced_browser_args(headless, docker)
            
            # Launch browser in headful mode by default
            actual_headless = headless and not HEADFUL_MODE
            
            browser = await launch_browser_with_stealth(p, actual_headless, browser_type, channel, args)
            if not browser:
                return False

            # Create enhanced browser context with stealth settings
            context = await create_stealth_browser_context(browser, docker)
            
            # Apply additional stealth scripts
            await apply_stealth_scripts(context)
            
            page = await context.new_page()

            # Continue with existing login and cookie extraction logic...
            # [Rest of the existing logic remains unchanged]
            
    except Exception as e:
        logger.error(f"Cookie refresh failed (headful={HEADFUL_MODE}, browser={browser_type}, channel={channel}): {e}")
        return False
```

#### 2.2 Create Enhanced Browser Arguments Function
```python
def get_enhanced_browser_args(headless: bool, docker: bool) -> List[str]:
    """Generate enhanced browser arguments for stealth mode."""
    args = PRODUCTION_BROWSER_ARGS.copy()
    
    # Add headful-specific arguments for better stealth
    if not headless:
        args.extend([
            '--start-maximized',
            '--window-size=1366,768',
            '--window-position=0,0',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=TranslateUI',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=PrivacySandboxSettings4',
            '--disable-features=PrivacySandboxAdsAPIsM1Override',
            '--disable-features=PrivacySandboxProactiveTopicsBlocking',
            '--disable-features=FedCm',
            '--disable-features=FedCmIdPRegistration',
            '--disable-features=FedCmIdPSigninStatus',
        ])
    
    # Docker-specific arguments
    if docker:
        args.extend([
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
        ])
        
        # Add virtual display for headful mode in Docker
        if not headless:
            args.extend([
                '--virtual-time-budget=5000',
                '--use-gl=swiftshader',
            ])
    
    return args
```

#### 2.3 Create Stealth Browser Launch Function
```python
async def launch_browser_with_stealth(
    p, 
    headless: bool, 
    browser_type: str = "chromium", 
    channel: Optional[str] = None,
    args: List[str] = None
) -> Optional[Browser]:
    """Launch browser with enhanced stealth configuration."""
    try:
        logger.info(f"Launching {browser_type} browser (headless={headless}, channel={channel})")
        
        # Choose browser type
        if browser_type == "firefox":
            browser = await p.firefox.launch(
                headless=headless,
                channel=channel,
                args=args or [],
                firefox_user_prefs={
                    'dom.webdriver.enabled': False,
                    'useAutomationExtension': False,
                    'devtools.jsonview.enabled': False,
                }
            )
        else:  # Default to chromium/chrome
            browser = await p.chromium.launch(
                headless=headless,
                channel=channel,
                args=args or [],
                chromium_sandbox=False,  # Disable sandbox for better compatibility
            )
        
        logger.info(f"Browser launched successfully: {browser_type}")
        return browser
        
    except Exception as e:
        logger.error(f"Failed to launch browser: {e}")
        return None
```

#### 2.4 Create Stealth Browser Context Function
```python
async def create_stealth_browser_context(browser: Browser, docker: bool) -> BrowserContext:
    """Create browser context with enhanced stealth settings."""
    
    # Enhanced viewport settings for headful mode
    viewport = {"width": 1366, "height": 768}
    if not HEADFUL_MODE:
        viewport["width"] = 1366
        viewport["height"] = 768
    
    context_opts = {
        'viewport': viewport,
        'user_agent': REALISTIC_UA,
        'locale': 'en-US',
        'timezone_id': 'UTC',
        'device_scale_factor': 1,
        'is_mobile': False,
        'has_touch': False,
        'java_script_enabled': True,
        'bypass_csp': False,
        'ignore_https_errors': False,
        'extra_http_headers': SECURITY_HEADERS.copy(),
        'permissions': ['geolocation'],
        'geolocation': {'latitude': 37.7749, 'longitude': -122.4194},
        'color_scheme': 'light',
        'forced_colors': 'none',
        'reduced_motion': 'no-preference',
        'screen': {
            'width': 1366,
            'height': 768,
        },
    }
    
    # Add storage state if available
    if os.path.exists(STORAGE_STATE_FILE):
        logger.info("Loading persisted YouTube storage state")
        try:
            context = await browser.new_context(
                storage_state=STORAGE_STATE_FILE, 
                **context_opts
            )
            return context
        except Exception as e:
            logger.warning(f"Failed to load storage state: {e}")
    
    # Create new context
    context = await browser.new_context(**context_opts)
    return context
```

#### 2.5 Create Stealth Scripts Application Function
```python
async def apply_stealth_scripts(context: BrowserContext) -> None:
    """Apply comprehensive stealth scripts to avoid detection."""
    
    # Enhanced stealth scripts for better evasion
    stealth_scripts = [
        # Remove webdriver property completely
        '''
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });
        ''',
        
        # Override plugins with realistic values
        '''
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                {
                    0: {
                        type: "application/x-google-chrome-pdf",
                        suffixes: "pdf",
                        description: "Portable Document Format",
                        enabledPlugin: Plugin
                    },
                    description: "Portable Document Format",
                    filename: "internal-pdf-viewer",
                    length: 1,
                    name: "Chrome PDF Plugin"
                },
                {
                    0: {
                        type: "application/pdf",
                        suffixes: "pdf",
                        description: "",
                        enabledPlugin: Plugin
                    },
                    description: "",
                    filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                    length: 1,
                    name: "Chrome PDF Viewer"
                }
            ]
        });
        ''',
        
        # Override languages
        '''
        Object.defineProperty(navigator, 'languages', {
            get: () => ["en-US", "en"]
        });
        ''',
        
        # Override platform
        '''
        Object.defineProperty(navigator, 'platform', {
            get: () => "Win32"
        });
        ''',
        
        # Override userAgentData with comprehensive details
        '''
        Object.defineProperty(navigator, 'userAgentData', {
            get: () => ({
                brands: [
                    {brand: "Chromium", version: "140"},
                    {brand: "Not;A=Brand", version: "99"},
                    {brand: "Google Chrome", version: "140"}
                ],
                mobile: false,
                platform: "Windows",
                getHighEntropyValues: async () => ({
                    platform: "Windows",
                    platformVersion: "10.0.0",
                    architecture: "x86",
                    bitness: "64",
                    model: "",
                    uaFullVersion: "140.0.0.0",
                    fullVersionList: [
                        {brand: "Chromium", version: "140.0.0.0"},
                        {brand: "Not;A=Brand", version: "99.0.0.0"},
                        {brand: "Google Chrome", version: "140.0.0.0"}
                    ]
                })
            })
        });
        ''',
        
        # Mock chrome runtime with comprehensive APIs
        '''
        window.chrome = {
            runtime: {
                sendMessage: function() { return Promise.resolve(); },
                onMessage: {
                    addListener: function() {},
                    removeListener: function() {}
                },
                onConnect: {
                    addListener: function() {},
                    removeListener: function() {}
                },
                connect: function() { 
                    return {
                        postMessage: function() {},
                        onMessage: {
                            addListener: function() {},
                            removeListener: function() {}
                        },
                        onDisconnect: {
                            addListener: function() {},
                            removeListener: function() {}
                        }
                    }; 
                }
            }
        };
        ''',
        
        # Override device memory and hardware concurrency
        '''
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4
        });
        ''',
        
        # Override screen resolution
        '''
        Object.defineProperty(screen, 'width', {
            get: () => 1366
        });
        Object.defineProperty(screen, 'height', {
            get: () => 768
        });
        Object.defineProperty(screen, 'availWidth', {
            get: () => 1366
        });
        Object.defineProperty(screen, 'availHeight', {
            get: () => 738
        });
        Object.defineProperty(screen, 'colorDepth', {
            get: () => 24
        });
        Object.defineProperty(screen, 'pixelDepth', {
            get: () => 24
        });
        ''',
        
        # Enhanced canvas fingerprinting protection
        '''
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type) {
            if (type === 'image/png' || !type) {
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            }
            return originalToDataURL.apply(this, arguments);
        };
        
        // Also protect getImageData
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function(x, y, width, height) {
            const imageData = originalGetImageData.apply(this, arguments);
            // Add slight noise to make fingerprinting harder
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + (Math.random() - 0.5) * 2));
                imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + (Math.random() - 0.5) * 2));
                imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + (Math.random() - 0.5) * 2));
            }
            return imageData;
        };
        ''',
        
        # WebGL fingerprinting protection
        '''
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) {
                return 'Intel Inc.';
            }
            if (parameter === 37446) {
                return 'Intel Iris OpenGL Engine';
            }
            return getParameter.apply(this, arguments);
        };
        
        // Protect WebGL2 as well
        if (window.WebGL2RenderingContext) {
            const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) {
                    return 'Intel Inc.';
                }
                if (parameter === 37446) {
                    return 'Intel Iris OpenGL Engine';
                }
                return getParameter2.apply(this, arguments);
            };
        }
        ''',
        
        # Mock media devices
        '''
        navigator.mediaDevices = {
            enumerateDevices: () => Promise.resolve([]),
            getUserMedia: () => Promise.reject(new Error('Not allowed')),
            getDisplayMedia: () => Promise.reject(new Error('Not allowed'))
        };
        ''',
        
        # Enhanced timing randomization
        '''
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        window.setTimeout = function(fn, delay) {
            const randomDelay = delay + Math.floor(Math.random() * 100);
            return originalSetTimeout.call(this, fn, randomDelay);
        };
        
        window.setInterval = function(fn, delay) {
            const randomDelay = delay + Math.floor(Math.random() * 50);
            return originalSetInterval.call(this, fn, randomDelay);
        };
        ''',
        
        # Mock Notification API
        '''
        window.Notification = function(title, options) {
            this.title = title;
            this.options = options;
            this.onclick = null;
            this.onshow = null;
            this.onerror = null;
            this.onclose = null;
        };
        window.Notification.permission = "granted";
        window.Notification.requestPermission = () => Promise.resolve("granted");
        ''',
    ]
    
    # Apply each script to the context
    for script in stealth_scripts:
        try:
            await context.add_init_script(script)
        except Exception as e:
            logger.warning(f"Failed to apply stealth script: {e}")
    
    logger.info("Applied comprehensive stealth scripts to browser context")
```

### Phase 3: Docker Configuration Updates

#### 3.1 Update Docker Compose Production
Remove browserless service and add Xvfb support:

```yaml
# docker-compose.prod.yml - Remove browserless service
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: nomtok_backend_prod
    ports:
      - "8030:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - HEADFUL_MODE=true
      - HEADFUL_DISPLAY=:99
      - DISPLAY=:99
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/cookies:/code/cookies
      - ./backend/logs:/code/logs
    depends_on:
      - redis
      - tor
    networks:
      - nomtok-network
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 30s
      retries: 3
      start_period: 40s

# Remove browserless service completely
```

#### 3.2 Update Backend Dockerfile
Add Xvfb and display support for headful mode:

```dockerfile
# backend/Dockerfile - Add Xvfb support
FROM python:3.13-slim-bookworm

WORKDIR /code

# Install system dependencies including Xvfb for headful mode
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    ffmpeg \
    xvfb \
    xauth \
    x11-utils \
    x11-xserver-utils \
    dbus-x11 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install yt-dlp nightly for latest fixes
RUN pip install --no-cache-dir --pre "yt-dlp[default]"

# Copy application code
COPY . .

# Create startup script for Xvfb and application
RUN echo '#!/bin/bash\n\
# Start Xvfb for headful mode\n\
Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &\n\
export DISPLAY=:99\n\
\n\
# Wait for Xvfb to start\n\
sleep 2\n\
\n\
# Start the application\n\
exec "$@"' > /start-xvfb.sh && chmod +x /start-xvfb.sh

# Set the entrypoint
ENTRYPOINT ["/start-xvfb.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Phase 4: Update Main Refresh Function

#### 4.1 Modify Refresh Function Logic
```python
async def refresh_youtube_cookies(headless: bool = True) -> bool:
    """Automate YouTube login via Google and export fresh cookies to Netscape format.
    
    Args:
        headless: Preferred mode (default True). Will use HEADFUL_MODE setting if configured.
    
    Returns:
        bool: True if successful.
    """
    _ensure_cookies_dir()

    docker = is_docker()
    if docker:
        logger.info("Docker detected; configuring Xvfb for headful mode")

    # Override headless setting with HEADFUL_MODE configuration
    actual_headless = headless and not HEADFUL_MODE
    
    if actual_headless:
        logger.info("Using headless mode")
    else:
        logger.info("Using headful mode for better stealth")

    # Primary attempt: Use Chrome with headful mode for better stealth
    success = await _run_refresh(actual_headless, browser_type="chrome", channel="chrome")
    
    # Fallback 1: If failed, retry with bundled Chromium
    if not success:
        logger.warning("Chrome failed; retrying with bundled Chromium")
        success = await _run_refresh(actual_headless, browser_type="chromium", channel=None)
    
    # Fallback 2: If still failed, retry with Firefox
    if not success:
        logger.warning("Chromium failed; retrying with Firefox")
        success = await _run_refresh(actual_headless, browser_type="firefox", channel=None)
    
    # Fallback 3: If all failed, try headless mode as last resort
    if not success and not actual_headless:
        logger.warning("All headful attempts failed; falling back to headless mode")
        success = await _run_refresh(True, browser_type="chrome", channel="chrome")
    
    return success
```

### Phase 5: Testing and Validation

#### 5.1 Create Test Script
```python
# backend/test_playwright_headful.py
#!/usr/bin/env python3
"""
Test script to verify Playwright headful mode configuration
"""

import os
import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from playwright.async_api import async_playwright
from app.utils.youtube_cookies import (
    get_enhanced_browser_args,
    launch_browser_with_stealth,
    create_stealth_browser_context,
    apply_stealth_scripts,
    HEADFUL_MODE
)

async def test_headful_mode():
    """Test headful mode configuration."""
    print("=== Testing Playwright Headful Mode ===")
    
    try:
        async with async_playwright() as p:
            # Test browser launch
            docker = os.path.exists('/.dockerenv')
            args = get_enhanced_browser_args(headless=False, docker=docker)
            
            browser = await launch_browser_with_stealth(
                p, 
                headless=False, 
                browser_type="chrome", 
                channel="chrome",
                args=args
            )
            
            if not browser:
                print("✗ Failed to launch browser")
                return False
            
            print("✓ Browser launched successfully in headful mode")
            
            # Test context creation
            context = await create_stealth_browser_context(browser, docker)
            print("✓ Browser context created with stealth settings")
            
            # Test stealth scripts
            await apply_stealth_scripts(context)
            print("✓ Stealth scripts applied successfully")
            
            # Test page creation and navigation
            page = await context.new_page()
            print("✓ New page created")
            
            # Test navigation to Google
            await page.goto("https://www.google.com", timeout=30000)
            await page.wait_for_load_state("networkidle")
            print(f"✓ Successfully navigated to Google - URL: {page.url}")
            
            # Test for detection
            is_detected = await page.evaluate("""
                () => {
                    return {
                        webdriver: navigator.webdriver,
                        plugins: navigator.plugins.length,
                        languages: navigator.languages,
                        platform: navigator.platform,
                        userAgentData: !!navigator.userAgentData,
                        chrome: !!window.chrome,
                        notification: Notification.permission
                    };
                }
            """)
            
            print(f"Detection check results: {is_detected}")
            
            if is_detected['webdriver'] is None and is_detected['plugins'] > 0:
                print("✓ Stealth scripts working - no automation detection")
            else:
                print("⚠ Potential detection issues detected")
            
            await browser.close()
            print("✓ Browser closed successfully")
            
            return True
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_youtube_access():
    """Test YouTube access with headful mode."""
    print("\n=== Testing YouTube Access ===")
    
    try:
        async with async_playwright() as p:
            docker = os.path.exists('/.dockerenv')
            args = get_enhanced_browser_args(headless=False, docker=docker)
            
            browser = await launch_browser_with_stealth(
                p, 
                headless=False, 
                browser_type="chrome", 
                channel="chrome",
                args=args
            )
            
            context = await create_stealth_browser_context(browser, docker)
            await apply_stealth_scripts(context)
            page = await context.new_page()
            
            # Navigate to YouTube
            await page.goto("https://www.youtube.com", timeout=30000)
            await page.wait_for_load_state("networkidle")
            
            # Check if we can access YouTube without issues
            title = await page.title()
            url = page.url
            
            print(f"✓ YouTube accessed successfully")
            print(f"  Title: {title}")
            print(f"  URL: {url}")
            
            # Check for any security warnings
            security_warning = await page.query_selector('text="browser is not secure"')
            if security_warning:
                print("⚠ Security warning detected!")
            else:
                print("✓ No security warnings detected")
            
            await browser.close()
            return True
            
    except Exception as e:
        print(f"✗ YouTube test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print(f"HEADFUL_MODE setting: {HEADFUL_MODE}")
    print(f"Running in Docker: {os.path.exists('/.dockerenv')}")
    
    # Test basic headful functionality
    basic_test = await test_headful_mode()
    
    # Test YouTube access
    youtube_test = await test_youtube_access()
    
    print(f"\n=== Test Results ===")
    print(f"Basic headful test: {'✓ PASS' if basic_test else '✗ FAIL'}")
    print(f"YouTube access test: {'✓ PASS' if youtube_test else '✗ FAIL'}")
    
    if basic_test and youtube_test:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
```

### Phase 6: Deployment Considerations

#### 6.1 Environment Requirements
- **Docker**: Ensure Xvfb is properly configured
- **Local Development**: Native browser support with GUI
- **Headless Fallback**: Maintain headless option for CI/CD environments

#### 6.2 Performance Optimization
- **Resource Limits**: Set appropriate memory and CPU limits
- **Concurrent Browsers**: Limit to 1-2 instances to avoid resource exhaustion
- **Timeout Configuration**: Adjust timeouts for headful mode (slower than headless)

#### 6.3 Security Considerations
- **Display Isolation**: Use virtual displays in Docker
- **Process Isolation**: Run browsers in separate processes
- **Resource Cleanup**: Ensure proper cleanup of browser processes

## Benefits of This Implementation

### 1. Enhanced Stealth Capabilities
- **Headful Mode**: Real browser window reduces detection
- **Comprehensive Scripts**: Multiple layers of automation detection avoidance
- **Realistic Fingerprinting**: Mimics real user environments

### 2. Simplified Architecture
- **No External Dependencies**: Removes Browserless API requirement
- **Direct Browser Control**: Full control over browser configuration
- **Reduced Complexity**: Eliminates WebSocket connection management

### 3. Better Reliability
- **Fallback Mechanisms**: Multiple browser types and modes
- **Local Testing**: Easier to test and debug locally
- **Resource Control**: Direct management of browser resources

### 4. Cost Efficiency
- **No Third-Party Services**: Eliminates Browserless API costs
- **Resource Optimization**: Better control over resource usage
- **Scalability**: Easier to scale based on actual needs

## Testing Strategy

### 1. Unit Tests
- Test individual browser launch functions
- Validate stealth script effectiveness
- Check cookie extraction functionality

### 2. Integration Tests
- Test complete authentication flow
- Validate YouTube access without security warnings
- Check fallback mechanism functionality

### 3. Production Tests
- Monitor for security warnings in production
- Track authentication success rates
- Measure performance impact

## Monitoring and Maintenance

### 1. Health Checks
- Browser launch success rates
- Authentication failure detection
- Resource usage monitoring

### 2. Stealth Effectiveness
- Regular testing of detection avoidance
- Updates to stealth scripts as needed
- Monitoring for new detection methods

### 3. Performance Monitoring
- Browser startup times
- Memory and CPU usage
- Authentication completion times

This implementation provides a robust, stealthy, and maintainable solution for YouTube authentication without relying on external browser services while maintaining all existing capabilities and improving detection avoidance.
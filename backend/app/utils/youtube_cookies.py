import os
import time
import asyncio
from datetime import datetime
from typing import Optional, cast
from http.cookiejar import MozillaCookieJar, Cookie

from playwright.async_api import async_playwright, BrowserContext

from app.config import YTDLP_COOKIES_FILE, GOOGLE_EMAIL, GOOGLE_PASSWORD 
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

# Paths for persisted state (mount these in Docker volumes for persistence)
STORAGE_STATE_FILE = os.path.join(os.path.dirname(cast(str, YTDLP_COOKIES_FILE)), 'youtube_storage_state.json')
COOKIES_LAST_REFRESH_FILE = os.path.join(os.path.dirname(cast(str, YTDLP_COOKIES_FILE)), 'cookies_last_refresh.txt')

async def refresh_youtube_cookies(headless: bool = True) -> bool:
    """Automate YouTube login via Google and export fresh cookies to Netscape format.
    
    Args:
        headless: Set False for initial manual verification.
    
    Returns:
        bool: True if successful.
    """
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless, args=['--no-sandbox', '--disable-dev-shm-usage'])  # Docker-friendly args
            context: Optional[BrowserContext] = None

            # Try loading persisted state first (skips login if valid)
            if os.path.exists(STORAGE_STATE_FILE):
                logger.info("Loading persisted YouTube storage state")
                context = await browser.new_context(storage_state=STORAGE_STATE_FILE)
            else:
                context = await browser.new_context()

            page = await context.new_page()

            # If no state or expired, perform login
            if not os.path.exists(STORAGE_STATE_FILE) or await _is_login_needed(page):
                logger.info("Performing Google/YouTube login")
                await _login_to_google(page)
                await _navigate_to_youtube(page)

                # Save new storage state for future runs
                await context.storage_state(path=STORAGE_STATE_FILE)
                logger.info(f"Saved storage state to {STORAGE_STATE_FILE}")

            # Extract and format cookies
            cookies = await context.cookies(["https://www.youtube.com", "https://accounts.google.com", ".google.com", ".youtube.com"])
            await _export_cookies_to_netscape(cookies)

            await browser.close()
            _update_last_refresh_timestamp()
            logger.info(f"Successfully refreshed cookies at {datetime.now()}")
            return True

    except Exception as e:
        logger.error(f"Cookie refresh failed: {e}")
        return False

async def _is_login_needed(page) -> bool:
    """Check if login is required (e.g., by looking for sign-in button)."""
    await page.goto("https://www.youtube.com")
    try:
        await page.wait_for_selector('yt-icon-button#avatar-btn', timeout=5000)
        return False  # Logged in (avatar present)
    except:
        return True

async def _login_to_google(page):
    """Automate Google login flow."""
    await page.goto("https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fwww.youtube.com&hl=en")

    # Enter email
    await page.fill('input[name="identifier"]', os.getenv('GOOGLE_EMAIL'))
    await page.click('button[jsname="LgbsSe"]')  # Next button (selector may vary; inspect if needed)

    # Wait for password field
    await page.wait_for_selector('input[name="Passwd"]', timeout=10000)
    await page.fill('input[name="Passwd"]', os.getenv('GOOGLE_PASSWORD'))
    await page.click('button[jsname="LgbsSe"]')  # Next

    # Wait for redirect (handle potential 2FA prompt manually if headless=False)
    await page.wait_for_url("**/youtube.com", timeout=30000)
    await asyncio.sleep(3)  # Stabilize

async def _navigate_to_youtube(page):
    """Ensure on YouTube to capture site-specific cookies."""
    await page.goto("https://www.youtube.com")
    await page.wait_for_load_state("networkidle")

async def _export_cookies_to_netscape(cookies: list[dict]):
    """Format Playwright cookies to Netscape .txt."""
    jar = MozillaCookieJar()
    for cookie in cookies:
        jar.set_cookie(Cookie(
            version=0,
            name=cookie['name'],
            value=cookie['value'],
            port=None,
            port_specified=False,
            domain=cookie['domain'],
            domain_initial_dot=cookie['domain'].startswith('.'),
            domain_specified=True,
            path=cookie.get('path', '/'),
            path_specified=True,
            secure=cookie.get('secure', False),
            expires=int(cookie.get('expires', 0)) if 'expires' in cookie and cookie['expires'] else None,
            discard=False,
            comment=None,
            comment_url=None,
            rest={},
            rfc2109=False,
        ))
    
    # Save with Netscape header
    jar.save(YTDLP_COOKIES_FILE, ignore_discard=True, ignore_expires=True)
    os.chmod(cast(str, YTDLP_COOKIES_FILE), 0o600)  # Secure permissions

def _update_last_refresh_timestamp():
    """Track last refresh time."""
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'w') as f:
        f.write(str(time.time()))

def get_cookies_age_hours() -> float:
    """Get age of cookies in hours (for on-demand refresh check)."""
    if not os.path.exists(cast(str, COOKIES_LAST_REFRESH_FILE)):
        return float('inf')
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'r') as f:
        timestamp = float(f.read().strip())
    return (time.time() - timestamp) / 3600
import os
import time
import asyncio
import re
from datetime import datetime
from typing import Optional, cast
from http.cookiejar import MozillaCookieJar, Cookie

from playwright.async_api import async_playwright, BrowserContext

from app.config import YTDLP_COOKIES_FILE, GOOGLE_EMAIL, GOOGLE_PASSWORD 
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

# Paths for persisted state (mount these in Docker volumes for persistence)
BASE_COOKIES_DIR = os.path.dirname(cast(str, YTDLP_COOKIES_FILE))
STORAGE_STATE_FILE = os.path.join(BASE_COOKIES_DIR, 'youtube_storage_state.json')
COOKIES_LAST_REFRESH_FILE = os.path.join(BASE_COOKIES_DIR, 'cookies_last_refresh.txt')

REALISTIC_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

def _ensure_cookies_dir():
    try:
        os.makedirs(BASE_COOKIES_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create cookies dir {BASE_COOKIES_DIR}: {e}")

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

    _ensure_cookies_dir()

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'])
            context: Optional[BrowserContext] = None

            context_opts = dict(locale='en-US', timezone_id='UTC', user_agent=REALISTIC_UA, viewport={"width": 1366, "height": 768})

            # Try loading persisted state first (skips login if valid)
            if os.path.exists(STORAGE_STATE_FILE):
                logger.info("Loading persisted YouTube storage state")
                context = await browser.new_context(storage_state=STORAGE_STATE_FILE, **context_opts)
            else:
                context = await browser.new_context(**context_opts)

            await context.add_init_script('Object.defineProperty(navigator, "webdriver", {get: () => undefined})')
            page = await context.new_page()

            # If no state or expired, perform login
            if not os.path.exists(STORAGE_STATE_FILE) or await _is_login_needed(page):
                logger.info("Performing Google/YouTube login")
                await _login_to_google(page)
                await _navigate_to_youtube(page)

                # Save new storage state for future runs
                _ensure_cookies_dir()
                await context.storage_state(path=STORAGE_STATE_FILE)
                logger.info(f"Saved storage state to {STORAGE_STATE_FILE}")

            # Extract and format cookies
            cookies = await context.cookies(["https://www.youtube.com", "https://accounts.google.com", "https://www.google.com"])
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
        await page.wait_for_selector('a#avatar-link, button#avatar-btn', timeout=5000)
        return False  # Logged in (avatar present)
    except:
        return True

async def _click_consent_if_present(page):
    """Dismiss Google/YouTube consent dialogs, including iframe-based ones."""
    try:
        await page.get_by_role("button", name=re.compile("Accept all|I agree|Accept|Agree|Accept cookies", re.I)).click(timeout=2000)
        logger.info("Dismissed consent on main page")
        await asyncio.sleep(1)
    except Exception:
        pass
    for frame in page.frames:
        try:
            if re.search(r"consent|privacy", frame.url):
                await frame.get_by_role("button", name=re.compile("Accept all|I agree|Accept|Agree|Accept cookies", re.I)).click(timeout=2000)
                logger.info("Dismissed consent inside iframe")
                await asyncio.sleep(1)
                break
        except Exception:
            continue

async def _ensure_identifier_input(page) -> None:
    selector_any = 'input[name="identifier"], input#identifierId, text=/Choose an account/i, text=/Use another account|Add account/i'
    try:
        await page.wait_for_selector(selector_any, timeout=15000)
    except Exception:
        await page.wait_for_load_state("networkidle")
        await _click_consent_if_present(page)

    for role in ["button", "link"]:
        try:
            use_another_regex = re.compile(
                "Use another account|Add account|Weitere Konto verwenden|Anderes Konto verwenden|Utiliser un autre compte|"
                "Usar otra cuenta|Usar outra conta|Usa un altro account|Использовать другой аккаунт|استخدام حساب آخر",
                re.I
            )
            handle = page.get_by_role(role, name=use_another_regex)
            if await handle.is_visible():
                await handle.click()
                logger.info("Clicked 'Use another account'")
                await page.wait_for_load_state("domcontentloaded")
                await _click_consent_if_present(page)
                break
        except Exception:
            pass

    def endpoints():
        return [
            "https://accounts.google.com/signin/v2/identifier?hl=en&passive=false&continue=https%3A%2F%2Fwww.youtube.com&flowName=GlifWebSignIn&flowEntry=ServiceLogin",
            "https://accounts.google.com/ServiceLogin?hl=en&passive=false&continue=https%3A%2F%2Fwww.youtube.com&service=youtube",
        ]

    for url in endpoints():
        try:
            await page.goto(url)
            await page.wait_for_load_state("domcontentloaded")
            await _click_consent_if_present(page)
            await page.wait_for_selector('input[name="identifier"], input#identifierId', timeout=10000)
            return
        except Exception:
            continue

    await page.goto("https://accounts.google.com/v3/signin/identifier?hl=en&continue=https%3A%2F%2Fwww.youtube.com")
    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

async def _ensure_password_input(page) -> None:
    """Ensure we reach the password entry screen, handling challenge flows like 'Use your phone' by choosing password instead."""
    # Try a few cycles to break through challenge screens
    for attempt in range(3):
        try:
            await page.wait_for_selector('input[type="password"], input[name="Passwd"], input#password, input[name="password"]', timeout=7000)
            return
        except Exception:
            pass
        # Common challenge headings/buttons
        try:
            # Try another way
            try_another = page.get_by_role("button", name=re.compile("Try another way|Use another method|Choose another method", re.I))
            if await try_another.is_visible():
                await try_another.click()
                await page.wait_for_load_state("domcontentloaded")
        except Exception:
            pass
        try:
            # Choose how to sign in
            choose_heading = page.get_by_text(re.compile("Choose how to sign in|Verify it'?s you|Verify it’s you", re.I))
            if await choose_heading.is_visible():
                # Prefer 'Enter your password' option
                enter_pwd = page.get_by_text(re.compile("Enter your password|Use password instead", re.I))
                if await enter_pwd.is_visible():
                    await enter_pwd.click()
                    await page.wait_for_load_state("domcontentloaded")
        except Exception:
            pass
        try:
            # Direct text-based fallback for 'Enter your password'
            for role in ["button", "link"]:
                opt = page.get_by_role(role, name=re.compile("Enter your password|Use password instead|Password", re.I))
                if await opt.is_visible():
                    await opt.click()
                    await page.wait_for_load_state("domcontentloaded")
                    break
        except Exception:
            pass
        await page.wait_for_load_state("networkidle")
        await _click_consent_if_present(page)
    # Final wait before giving up
    await page.wait_for_selector('input[type="password"], input[name="Passwd"], input#password, input[name="password"]', timeout=20000)

async def _login_to_google(page):
    """Automate Google login flow with robust selectors and consent handling."""
    await page.goto("https://accounts.google.com/v3/signin/identifier?hl=en&continue=https%3A%2F%2Fwww.youtube.com")
    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

    await _ensure_identifier_input(page)

    email_value = os.getenv('GOOGLE_EMAIL')
    logger.info("Filling email identifier")
    filled = False
    for sel in ['input[name="identifier"]', 'input#identifierId']:
        try:
            await page.wait_for_selector(sel, timeout=10000)
            await page.focus(sel)
            await page.fill(sel, email_value)
            filled = True
            break
        except Exception:
            continue

    if not filled:
        try:
            await page.get_by_placeholder(re.compile("Email|Email or phone|E-mail|Correo", re.I)).fill(email_value)
            filled = True
        except Exception:
            pass

    if not filled:
        try:
            await page.get_by_label(re.compile("Email|Email address|Identifier|E-mail|Correo|Mail|Adresse", re.I)).fill(email_value)
            filled = True
        except Exception:
            pass

    if not filled:
        raise RuntimeError("Could not locate email/identifier field on Google sign-in")

    try:
        await page.locator('#identifierNext').click()
    except Exception:
        await page.get_by_role("button", name=re.compile("Next|Weiter|Suivant|Avanti|Siguiente|Далее|التالي", re.I)).click()

    await _ensure_password_input(page)

    await page.wait_for_load_state("domcontentloaded")
    await _click_consent_if_present(page)

    pwd_value = os.getenv('GOOGLE_PASSWORD')
    logger.info("Filling password")
    filled_pwd = False
    for sel in ['input[type="password"][name="Passwd"]', 'input[type="password"]', 'input#password', 'input[name="password"]']:
        try:
            await page.wait_for_selector(sel, timeout=20000)
            await page.focus(sel)
            await page.fill(sel, pwd_value)
            filled_pwd = True
            break
        except Exception:
            continue
    if not filled_pwd:
        try:
            await page.get_by_placeholder(re.compile("Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور", re.I)).fill(pwd_value)
            filled_pwd = True
        except Exception:
            pass
    if not filled_pwd:
        try:
            await page.get_by_label(re.compile("Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور", re.I)).fill(pwd_value)
            filled_pwd = True
        except Exception:
            pass
    if not filled_pwd:
        raise RuntimeError("Could not locate password field on Google sign-in")

    try:
        await page.locator('#passwordNext').click()
    except Exception:
        await page.get_by_role("button", name=re.compile("Next|Weiter|Suivant|Avanti|Siguiente|Далее|التالي", re.I)).click()

    try:
        await page.wait_for_url(re.compile(".*youtube.com.*"), timeout=30000)
    except Exception:
        await page.goto("https://www.youtube.com")
        await page.wait_for_load_state("domcontentloaded")

    await asyncio.sleep(3)

async def _navigate_to_youtube(page):
    await page.goto("https://www.youtube.com")
    await page.wait_for_load_state("networkidle")

async def _export_cookies_to_netscape(cookies: list[dict]):
    _ensure_cookies_dir()
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
    jar.save(YTDLP_COOKIES_FILE, ignore_discard=True, ignore_expires=True)
    try:
        os.chmod(cast(str, YTDLP_COOKIES_FILE), 0o600)
    except Exception:
        # os.chmod may not be supported on Windows in the same way; ignore
        pass

def _update_last_refresh_timestamp():
    _ensure_cookies_dir()
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'w') as f:
        f.write(str(time.time()))

def get_cookies_age_hours() -> float:
    if not os.path.exists(cast(str, COOKIES_LAST_REFRESH_FILE)):
        return float('inf')
    with open(cast(str, COOKIES_LAST_REFRESH_FILE), 'r') as f:
        timestamp = float(f.read().strip())
    return (time.time() - timestamp) / 3600
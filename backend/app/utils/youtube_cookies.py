import os
import time
import asyncio
import re
from datetime import datetime
from typing import Optional, cast
from http.cookiejar import MozillaCookieJar, Cookie

from playwright_stealth import Stealth
from playwright.async_api import async_playwright, BrowserContext, Page, TimeoutError

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
    "Chrome/140.0.0.0 Safari/537.36"
)

def _ensure_cookies_dir():
    try:
        os.makedirs(BASE_COOKIES_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create cookies dir {BASE_COOKIES_DIR}: {e}")

async def _run_refresh(headless: bool) -> bool:
    """Internal helper to run the refresh logic with given headless mode."""
    if not GOOGLE_EMAIL or not GOOGLE_PASSWORD:
        logger.error("GOOGLE_EMAIL and GOOGLE_PASSWORD env vars required for cookie refresh")
        return False

    try:
        async with Stealth().use_async(async_playwright()) as p:
            browser = await p.chromium.launch(
                headless=headless,
                channel="chrome",  # System Chrome (run `playwright install chrome`)
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-automation',
                    '--disable-extensions',
                    '--no-first-run',
                    '--no-service-autorun',
                    '--password-store=basic',
                    '--disable-background-networking',
                    '--disable-component-extensions-with-background-pages',  # Key for auth bypass
                    '--disable-client-side-phishing-detection',
                    '--disable-default-apps',
                    # Headless-specific: Mimic headful viewport/rendering
                    '--virtual-time-budget=5000' if headless else '',
                ]
            )
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
            logger.info(f"Successfully refreshed cookies at {datetime.now()} (headless={headless})")
            return True

    except Exception as e:
        logger.error(f"Cookie refresh failed (headless={headless}): {e}")
        return False

async def refresh_youtube_cookies(headless: bool = True) -> bool:
    """Automate YouTube login via Google and export fresh cookies to Netscape format.
    
    Args:
        headless: Preferred mode (default True). If fails, falls back to headful.
    
    Returns:
        bool: True if successful.
    """
    _ensure_cookies_dir()

    # Primary attempt: Use preferred headless mode
    success = await _run_refresh(headless)
    
    # Fallback: If failed and preferred was headless, retry headful
    if not success and headless:
        logger.warning("Headless refresh failed; falling back to headful mode (requires Xvfb in Docker)")
        success = await _run_refresh(False)
    
    return success

async def _is_login_needed(page) -> bool:
    """Check if login is required by verifying authenticated YouTube elements."""
    await page.goto("https://www.youtube.com")
    await page.wait_for_load_state("networkidle", timeout=10000)
    
    # Multi-check: Avatar + dashboard indicators (more robust than single selector)
    auth_selectors = [
        'a#avatar-link, button#avatar-btn',  # Avatar
        'yt-icon-button#avatar-btn',  # Alternative avatar
        'div#endpoint[title*="Subscriptions"]',  # Dashboard presence
        'ytd-rich-grid-renderer',  # Home feed (logged-in only)
    ]
    
    for selector in auth_selectors:
        try:
            await page.wait_for_selector(selector, timeout=3000)
            logger.info(f"Auth confirmed via: {selector}")
            return False  # Logged in
        except Exception:
            continue
    
    # Fallback: Explicit sign-in prompt
    try:
        signin = page.locator('tp-yt-iron-button:has-text("Sign in")')
        if await signin.is_visible(timeout=2000):
            logger.warning("Sign-in prompt detected")
            return True
    except Exception:
        pass
    
    return True  # Assume needed if no auth signals

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

async def _handle_rejection_and_retry(page: Page, max_retries: int = 2) -> bool:
    """
    Detect Google's 'Couldn't sign you in' rejection page and attempt to retry by clicking 'Try again'.
    
    Args:
        page: The Playwright page object.
        max_retries: Maximum number of retry attempts (default: 2 to avoid infinite loops).
    
    Returns:
        bool: True if a successful retry was performed (rejection detected and 'Try again' clicked),
              False otherwise (no rejection or retry failed).
    """
    rejection_text_selectors = [
        'text="Couldn’t sign you in"',
        'text=/browser or app may not be secure/i',
        'h1:has-text("Couldn’t sign you in")',
    ]
    try_again_selectors = [
        'button:has-text("Try again")',  # CSS text match
        'tp-yt-paper-button:has-text("Try again")',  # Google's custom elements (if Material Design)
        'div[role="button"]:has-text("Try again")',  # Fallback for div-as-button
    ]
    
    retry_count = 0
    while retry_count < max_retries:
        # Check for rejection page
        rejection_detected = False
        for selector in rejection_text_selectors:
            try:
                if await page.locator(selector).is_visible(timeout=3000):
                    rejection_detected = True
                    break
            except Exception:
                continue
        
        if not rejection_detected:
            return False  # No rejection; proceed normally
        
        logger.warning(f"Hit rejection page on attempt {retry_count + 1}/{max_retries}; attempting 'Try again'")
        
        # Wait explicitly for the button to appear (give JS time to render)
        try:
            await page.wait_for_selector('text="Try again"', timeout=5000, state="visible")
        except TimeoutError:
            logger.debug("Explicit wait for 'Try again' text timed out; trying fallbacks")
        
        # Try multiple click methods
        clicked = False
        for selector in try_again_selectors:
            try:
                button = page.locator(selector)
                if await button.is_visible(timeout=3000) and await button.is_enabled(timeout=3000):
                    await button.click(delay=200)  # Human-like mouse delay
                    clicked = True
                    logger.info(f"Successfully clicked 'Try again' with selector: {selector}")
                    break
            except Exception as e:
                logger.debug(f"Selector '{selector}' failed: {e}")
                continue
        
        # Fallback: Direct text-based click if CSS fails
        if not clicked:
            try:
                # Use get_by_text for exact/partial match (case-insensitive via regex if needed)
                await page.get_by_text("Try again", exact=False).click(timeout=5000, delay=200)
                clicked = True
                logger.info("Successfully clicked 'Try again' via get_by_text")
            except Exception as e:
                logger.debug(f"get_by_text fallback failed: {e}")
        
        # Ultimate fallback: JS click on any element containing the text
        if not clicked:
            try:
                button_elements = await page.query_selector_all('button, [role="button"], div[jsaction*="click"]')
                for elem in button_elements:
                    text = await elem.text_content()
                    if text and "Try again" in text:
                        await page.evaluate('el => el.click()', elem)
                        clicked = True
                        logger.info("Successfully JS-clicked 'Try again' element")
                        break
            except Exception as e:
                logger.debug(f"JS fallback failed: {e}")
        
        if not clicked:
            logger.error("Could not locate or click 'Try again' button with any method")
            # Diagnostic: Save current page state
            try:
                os.makedirs("logs", exist_ok=True)
                diag_path = os.path.join("logs", f"rejection-click-fail-{int(time.time())}.png")
                await page.screenshot(path=diag_path, full_page=True)
                logger.warning(f"Saved diagnostic screenshot: {diag_path}")
            except Exception:
                pass
            return False
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await asyncio.sleep(3)  # Settle time for redirects

        current_url = page.url
        if "/signin/identifier" in current_url or "/signin/v2/identifier" in current_url:
            logger.warning("Looped back to identifier after 'Try again'; aborting to avoid flag escalation")
            raise RuntimeError("Rejection loop detected; run non-headless to refresh state")

        try:
            os.makedirs("logs", exist_ok=True)
            post_click_path = os.path.join("logs", f"post-try-again-click-{int(time.time())}.png")
            await page.screenshot(path=post_click_path, full_page=True)
            logger.info(f"Post-'Try again' screenshot saved: {post_click_path} (URL: {page.url})")
        except Exception as e:
            logger.warning(f"Screenshot failed: {e}")

        retry_count += 1
        
        # Re-attempt password flow post-click
        try:
            await _ensure_password_input(page)
        except Exception as e:
            logger.warning(f"Password flow retry failed after rejection: {e}")
    
    if retry_count >= max_retries:
        logger.error("Max retries exceeded on rejection page")
        return False
    
    return True

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
    """Ensure we reach the password entry screen, handling challenge flows and locale variants robustly."""
    # Broad set of selectors that have appeared across Google login variants/locales
    password_selectors = [
        'input[name="Passwd"]',
        'input[type="password"][name="Passwd"]',
        'input[type="password"]',
        'input#password',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[aria-label*="password" i]'
    ]

    # Common actions/prompts that lead to password entry
    enter_password_regex = re.compile(
        "Enter your password|Use password instead|Password|Passwort|Mot de passe|Senha|Contraseña|Пароль|كلمة المرور",
        re.I,
    )
    try_another_way_regex = re.compile(
        "Try another way|Use another method|Choose another method|Try a different way",
        re.I,
    )
    choose_how_regex = re.compile(
        "Choose how to sign in|Verify it'?s you|Verify it's you|Confirm it's you",
        re.I,
    )
    continue_regex = re.compile(
        "Continue|Fortfahren|Continuer|Continuar|Continuare|Продолжить|МТАБПАРАВОТА",
        re.I,
    )

    # Attempt multiple cycles to navigate to password screen
    for attempt in range(8):  # Increased from 5 to 8
        logger.info(f"Password field search attempt {attempt + 1}/8")
        
        # 1) Directly look for a visible password input
        try:
            locator = page.locator(", ".join(password_selectors)).first
            await locator.wait_for(state="visible", timeout=6000)
            logger.info("Password field found!")
            return
        except Exception:
            pass

        # 2) If not found, click common challenge actions
        try:
            # Click 'Use password instead' / 'Enter your password' when present
            for role in ["button", "link"]:
                option = page.get_by_role(role, name=enter_password_regex)
                if await option.is_visible():
                    logger.info(f"Clicking '{await option.text_content()}' option")
                    await option.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    break
        except Exception:
            pass

        try:
            # Click 'Try another way' to reveal methods, then pick password
            for role in ["button", "link"]:
                another = page.get_by_role(role, name=try_another_way_regex)
                if await another.is_visible():
                    logger.info("Clicking 'Try another way'")
                    await another.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    # After changing methods, prefer password
                    for role2 in ["button", "link"]:
                        pwdopt = page.get_by_role(role2, name=enter_password_regex)
                        if await pwdopt.is_visible():
                            logger.info("Selecting password option")
                            await pwdopt.click()
                            await page.wait_for_load_state("domcontentloaded")
                            await asyncio.sleep(1)
                            break
                    break
        except Exception:
            pass

        try:
            # If a heading is present, we are on chooser screen
            chooser = page.get_by_text(choose_how_regex)
            if await chooser.is_visible():
                logger.info("On verification chooser screen")
                for role in ["button", "link"]:
                    pwd = page.get_by_role(role, name=enter_password_regex)
                    if await pwd.is_visible():
                        logger.info("Selecting password verification method")
                        await pwd.click()
                        await page.wait_for_load_state("domcontentloaded")
                        await asyncio.sleep(1)
                        break
        except Exception:
            pass

        try:
            # Occasionally Google shows a welcome/continue interstitial
            for role in ["button", "link"]:
                cont = page.get_by_role(role, name=continue_regex)
                if await cont.is_visible():
                    logger.info("Clicking 'Continue' button")
                    await cont.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await asyncio.sleep(1)
                    break
        except Exception:
            pass

        # 3) Clean up overlays/consent and wait for network to settle
        await page.wait_for_load_state("networkidle", timeout=10000)

        if await _handle_rejection_and_retry(page):
            continue  # Retry the password search after handling rejection

        await _click_consent_if_present(page)

        # 4) Small backoff before next probe
        await asyncio.sleep(2)  # Increased from 0.5 to 2

    # Take screenshot before final timeout for debugging
    try:
        current_url = page.url
        current_title = await page.title()
        logger.warning(f"Password field not found after retries. URL: {current_url}, Title: {current_title}...")
        os.makedirs("logs", exist_ok=True)
        screenshot_path = os.path.join("logs", f"password-not-found-{int(time.time())}.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        logger.warning(f"Saved diagnostic screenshot: {screenshot_path}")
        
        # Also log page content for debugging
        page_content = await page.content()
        content_path = os.path.join("logs", f"password-not-found-{int(time.time())}.html")
        with open(content_path, "w", encoding="utf-8") as f:
            f.write(page_content)
        logger.warning(f"Saved page HTML: {content_path}")
    except Exception as e:
        logger.error(f"Failed to capture diagnostics: {e}")
    
    # Final explicit wait (will raise if still not present)
    await page.wait_for_selector(
        ", ".join(password_selectors),
        timeout=30000,
    )

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

    logger.info("Clicking 'Next' after email")
    try:
        await page.locator('#identifierNext').click()
    except Exception:
        await page.get_by_role("button", name=re.compile("Next|Weiter|Suivant|Avanti|Siguiente|Далее|التالي", re.I)).click()

    # Wait for navigation to complete after email submission
    logger.info("Waiting for navigation after email submission...")
    await asyncio.sleep(3)  # Give Google time to process
    await page.wait_for_load_state("networkidle", timeout=30000)
    await _click_consent_if_present(page)
    
    # Take a screenshot to debug what page we're on
    try:
        os.makedirs("logs", exist_ok=True)
        screenshot_path = os.path.join("logs", f"after-email-submit-{int(time.time())}.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        logger.info(f"After email submit - URL: {page.url}, saved screenshot: {screenshot_path}")
    except Exception:
        pass
    
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
        # Diagnostics: log current URL/title and capture a screenshot to aid debugging
        try:
            current_title = await page.title()
            logger.error(f"Password field not found at URL: {page.url} - title: {current_title}")
            os.makedirs("logs", exist_ok=True)
            screenshot_path = os.path.join("logs", f"google-password-field-missing-{int(time.time())}.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            logger.error(f"Saved diagnostic screenshot: {screenshot_path}")
        except Exception:
            pass
        raise RuntimeError("Could not locate password field on Google sign-in")

    logger.info("Clicking 'Next' after password")
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
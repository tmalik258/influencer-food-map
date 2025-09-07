from typing import Optional, Tuple
from pycountry import countries

from app.utils.logging import setup_logger

logger = setup_logger(__name__)


def get_country_name_from_code(country_code: str) -> Optional[str]:
    """
    Get the full country name from ISO 3166-1 alpha-2 country code.
    
    Args:
        country_code (str): The ISO 3166-1 alpha-2 country code
        
    Returns:
        Optional[str]: Full country name or None if not found
    """
    if not country_code or len(country_code) != 2:
        return None
    
    try:
        country = countries.get(alpha_2=country_code.upper())
        return country.name if country else None
    except Exception as e:
        logger.warning(f"Error getting country name for code {country_code}: {e}")
        return None


def normalize_region_to_country_info(region: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Convert region data to standardized ISO 3166-1 alpha-2 country code and full country name.
    
    Conversion rules:
    1. Direct ISO codes (e.g., 'us' remains 'us')
    2. Common alternate formats (e.g., 'usa' → 'us', 'uk' → 'gb')
    3. Case insensitive matching
    4. Preserve original values that don't match any pattern
    
    Args:
        region (str): The region value to convert
        
    Returns:
        Tuple[Optional[str], Optional[str]]: (country_code, country_name) or (None, None) if no match
    """
    country_code = normalize_region_to_country_code(region)
    country_name = get_country_name_from_code(country_code) if country_code else None
    return country_code, country_name


def normalize_region_to_country_code(region: str) -> Optional[str]:
    """
    Convert region data to standardized ISO 3166-1 alpha-2 country codes.
    
    Conversion rules:
    1. Direct ISO codes (e.g., 'us' remains 'us')
    2. Common alternate formats (e.g., 'usa' → 'us', 'uk' → 'gb')
    3. Case insensitive matching
    4. Preserve original values that don't match any pattern
    
    Args:
        region (str): The region value to convert
        
    Returns:
        Optional[str]: ISO 3166-1 alpha-2 country code or None if no match
    """
    if not region:
        return None
    
    region_lower = region.lower().strip()
    
    # Direct country code mappings (common variations to ISO codes)
    country_mappings = {
        # North America
        "usa": "US",
        "united states": "US",
        "america": "US",
        "us": "US",
        "canada": "CA",
        "ca": "CA",
        "mexico": "MX",
        "mx": "MX",
        
        # Europe
        "uk": "GB",
        "gb": "GB",
        "united kingdom": "GB",
        "britain": "GB",
        "england": "GB",
        "germany": "DE",
        "de": "DE",
        "france": "FR",
        "fr": "FR",
        "italy": "IT",
        "it": "IT",
        "spain": "ES",
        "es": "ES",
        "netherlands": "NL",
        "nl": "NL",
        "sweden": "SE",
        "se": "SE",
        "norway": "NO",
        "no": "NO",
        "denmark": "DK",
        "dk": "DK",
        "finland": "FI",
        "fi": "FI",
        "iceland": "IS",
        "is": "IS",
        "austria": "AT",
        "at": "AT",
        "switzerland": "CH",
        "ch": "CH",
        "belgium": "BE",
        "be": "BE",
        "portugal": "PT",
        "pt": "PT",
        "ireland": "IE",
        "ie": "IE",
        
        # Asia-Pacific
        "australia": "AU",
        "au": "AU",
        "japan": "JP",
        "jp": "JP",
        "south korea": "KR",
        "korea": "KR",
        "kr": "KR",
        "india": "IN",
        "in": "IN",
        "china": "CN",
        "cn": "CN",
        "thailand": "TH",
        "th": "TH",
        "vietnam": "VN",
        "vn": "VN",
        "singapore": "SG",
        "sg": "SG",
        "malaysia": "MY",
        "my": "MY",
        "indonesia": "ID",
        "id": "ID",
        "philippines": "PH",
        "ph": "PH",
        "new zealand": "NZ",
        "nz": "NZ",
        
        # South America
        "brazil": "BR",
        "br": "BR",
        "argentina": "AR",
        "ar": "AR",
        "chile": "CL",
        "cl": "CL",
        "colombia": "CO",
        "co": "CO",
        "peru": "PE",
        "pe": "PE",
        
        # Other
        "russia": "RU",
        "ru": "RU",
        "south africa": "ZA",
        "za": "ZA",
    }
    
    # Check direct mappings first
    if region_lower in country_mappings:
        return country_mappings[region_lower]
    
    # Try to find country by name using pycountry
    try:
        country = countries.lookup(region)
        return country.alpha_2
    except LookupError:
        pass
    
    # If it's already a valid 2-letter ISO code, return it uppercase
    if len(region) == 2 and region.isalpha():
        try:
            country = countries.get(alpha_2=region.upper())
            if country:
                return region.upper()
        except Exception:
            pass
    
    # No match found - return None to preserve original region value
    logger.warning(f"No country mapping found for region: {region}")
    return None
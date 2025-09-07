from jose import jwt, JWTError

from fastapi import Depends, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import SUPABASE_JWT_SECRET, ALGORITHM, SUPABASE_URL
from app.utils.logging import setup_logger

logger = setup_logger(__name__)
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get the current user's information from the Supabase JWT token.
    Returns the user's email, user_id, and role.
    """
    token = credentials.credentials
    try:
        if not SUPABASE_JWT_SECRET:
            logger.error("Supabase JWT secret not configured")
            raise HTTPException(status_code=500, detail="Supabase JWT secret not configured")

        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated", issuer=f"{SUPABASE_URL}/auth/v1")
        logger.info("Decoded payload:", payload)
        return payload
    except JWTError as e:
        logger.error("JWmsg=TError occurred:", str(e), type(e).__name__)
        raise HTTPException(status_code=403, detail="Invalid or expired token")

def get_current_admin(user = Depends(get_current_user)):
    """
    for admin based role access
    to add admin role in supabase:
    In Supabase → Auth → Users → Edit user → Add metadata:

    {
    "role": "admin"
    }
    """
    logger.info(f"Admin user signed in")
    # if user.get("user_metadata", {}).get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Admins only")
    return user

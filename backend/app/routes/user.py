from fastapi import APIRouter, Depends

from app.dependencies import (get_current_user, get_current_admin)

router = APIRouter()

@router.get("/me")
def get_me(user=Depends(get_current_user)):
    """
    Get current user information.
    Returns the user's email, user_id, and role.
    """
    return {
        "email": user["email"],
        "user_id": user["sub"],
        "role": user.get("role", "user")
    }

@router.get("/admin-area")
def admin_only(admin_user=Depends(get_current_admin)):
    """
    Admin-only route to access admin area.
    Returns a welcome message for admins.
    """
    return {"message": "Welcome, admin!"}

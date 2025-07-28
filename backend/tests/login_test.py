from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

result = supabase.auth.sign_in_with_password({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
token = result.session.access_token
print("Access token:", token)

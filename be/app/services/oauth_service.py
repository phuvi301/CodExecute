import os
import urllib.parse
import logging
import httpx
from dotenv import load_dotenv
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_oauth_config():
    """Tự động nạp động các biến môi trường từ .env mỗi khi xử lý request"""
    load_dotenv(dotenv_path=".env", override=True)
    return {
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID") or settings.GOOGLE_CLIENT_ID,
        "google_client_secret": os.getenv("GOOGLE_CLIENT_SECRET") or settings.GOOGLE_CLIENT_SECRET,
        "google_redirect_uri": os.getenv("GOOGLE_REDIRECT_URI") or settings.GOOGLE_REDIRECT_URI,
        "github_client_id": os.getenv("GITHUB_CLIENT_ID") or settings.GITHUB_CLIENT_ID,
        "github_client_secret": os.getenv("GITHUB_CLIENT_SECRET") or settings.GITHUB_CLIENT_SECRET,
        "github_redirect_uri": os.getenv("GITHUB_REDIRECT_URI") or settings.GITHUB_REDIRECT_URI,
    }

# --- GOOGLE OAUTH ---
def get_google_auth_url(redirect_uri: str = None) -> str:
    config = get_oauth_config()
    client_id = config["google_client_id"]
    if not client_id or client_id.startswith("your-google"):
        raise HTTPException(
            status_code=500,
            detail="Google OAuth chưa được cấu hình Client ID. Vui lòng cập nhật GOOGLE_CLIENT_ID trong .env"
        )
    
    cb_uri = redirect_uri or config["google_redirect_uri"]
    params = {
        "client_id": client_id,
        "redirect_uri": cb_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": "google"
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

async def exchange_google_code(code: str, redirect_uri: str = None) -> dict:
    config = get_oauth_config()
    client_id = config["google_client_id"]
    client_secret = config["google_client_secret"]
    cb_uri = redirect_uri or config["google_redirect_uri"]

    if not client_id or not client_secret or client_id.startswith("your-google"):
        raise HTTPException(status_code=500, detail="Google OAuth Credentials chưa được cấu hình hợp lệ trong .env")

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": cb_uri,
        "grant_type": "authorization_code"
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=token_data)
        if token_resp.status_code != 200:
            logger.error(f"Lỗi khi đổi code với Google: {token_resp.text}")
            raise HTTPException(status_code=400, detail="Không thể xác thực mã xác nhận Google OAuth (Code không hợp lệ hoặc hết hạn)")

        tokens = token_resp.json()
        access_token = tokens.get("access_token")

        user_info_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Không thể lấy thông tin tài khoản từ Google")

        user_info = user_info_resp.json()
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Tài khoản Google không trả về địa chỉ email")

        return {
            "email": email.strip().lower(),
            "full_name": user_info.get("name") or email.split("@")[0],
            "avatar_url": user_info.get("picture") or "",
            "provider": "google",
            "provider_id": user_info.get("id")
        }

# --- GITHUB OAUTH ---
def get_github_auth_url(redirect_uri: str = None) -> str:
    config = get_oauth_config()
    client_id = config["github_client_id"]
    if not client_id or client_id.startswith("your-github"):
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth chưa được cấu hình Client ID. Vui lòng cập nhật GITHUB_CLIENT_ID trong .env"
        )

    cb_uri = redirect_uri or config["github_redirect_uri"]
    params = {
        "client_id": client_id,
        "redirect_uri": cb_uri,
        "scope": "read:user user:email",
        "state": "github"
    }
    return f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"

async def exchange_github_code(code: str, redirect_uri: str = None) -> dict:
    config = get_oauth_config()
    client_id = config["github_client_id"]
    client_secret = config["github_client_secret"]
    cb_uri = redirect_uri or config["github_redirect_uri"]

    if not client_id or not client_secret or client_id.startswith("your-github"):
        raise HTTPException(status_code=500, detail="GitHub OAuth Credentials chưa được cấu hình hợp lệ trong .env")

    token_url = "https://github.com/login/oauth/access_token"
    token_payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": cb_uri
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            token_url,
            json=token_payload,
            headers={"Accept": "application/json"}
        )
        if token_resp.status_code != 200:
            logger.error(f"Lỗi khi đổi code với GitHub: {token_resp.text}")
            raise HTTPException(status_code=400, detail="Không thể xác thực mã xác nhận GitHub OAuth")

        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            logger.error(f"GitHub token response không có access_token: {tokens}")
            raise HTTPException(status_code=400, detail=tokens.get("error_description", "Mã xác thực GitHub không hợp lệ hoặc đã sử dụng"))

        headers = {"Authorization": f"Bearer {access_token}", "User-Agent": "CodExecute-App"}

        # Lấy thông tin user profile
        profile_resp = await client.get("https://api.github.com/user", headers=headers)
        if profile_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Không thể lấy thông tin tài khoản từ GitHub")
        profile = profile_resp.json()

        # Lấy danh sách email nếu profile public email bị ẩn
        email = profile.get("email")
        if not email:
            emails_resp = await client.get("https://api.github.com/user/emails", headers=headers)
            if emails_resp.status_code == 200:
                emails_data = emails_resp.json()
                primary_verified = next((e["email"] for e in emails_data if e.get("primary") and e.get("verified")), None)
                if not primary_verified and len(emails_data) > 0:
                    primary_verified = emails_data[0].get("email")
                email = primary_verified

        if not email:
            raise HTTPException(status_code=400, detail="Tài khoản GitHub không cung cấp email hợp lệ")

        return {
            "email": email.strip().lower(),
            "full_name": profile.get("name") or profile.get("login") or email.split("@")[0],
            "avatar_url": profile.get("avatar_url") or "",
            "provider": "github",
            "provider_id": str(profile.get("id"))
        }


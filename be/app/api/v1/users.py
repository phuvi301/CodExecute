from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.user import UserUpdate
from app.services import auth_service, storage_service
from app.core import security

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)

def format_user(user: dict):
    raw_avatar = user.get("AvatarUrl", "")
    title = user.get("Title")
    if not title or title == "Full Stack Engineer":
        title = "Developer"
    
    address = user.get("Address")
    if not address or address == "San Francisco, CA":
        address = "Ho Chi Minh, Vietnam"

    return {
        "user_id": user.get("UserID"),
        "email": user.get("Email"),
        "full_name": user.get("FullName", ""),
        "avatar_url": storage_service.get_public_avatar_url(raw_avatar),
        "title": title,
        "address": address,
        "bio": user.get("Bio", ""),
        "created_at": user.get("CreatedAt", "2023-03-15T00:00:00Z"),
        "role": user.get("Role", "user")
    }

@router.get("/me")
async def get_my_profile(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = security.decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    user_id = payload.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user(user)

@router.put("/me")
@router.patch("/me")
async def update_my_profile(
    payload: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token_data = security.decode_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    
    user_id = token_data.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_fields = {}

    if payload.full_name is not None:
        clean_name = payload.full_name.strip() if isinstance(payload.full_name, str) else payload.full_name
        if not clean_name:
            raise HTTPException(status_code=400, detail="Full name cannot be empty")
        update_fields["FullName"] = clean_name

    if payload.avatar_url is not None:
        update_fields["AvatarUrl"] = payload.avatar_url

    if payload.title is not None:
        update_fields["Title"] = payload.title.strip()

    if payload.address is not None:
        update_fields["Address"] = payload.address.strip()

    if payload.bio is not None:
        update_fields["Bio"] = payload.bio.strip()

    if payload.new_password:
        if not payload.old_password or not payload.old_password.strip():
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại là bắt buộc khi thay đổi mật khẩu")
        if not security.verify_password(payload.old_password, user.get("PasswordHash", "")):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")
        try:
            security.validate_password_strength(payload.new_password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        update_fields["PasswordHash"] = security.hash_password(payload.new_password)
    elif payload.old_password and payload.old_password.strip():
        if not security.verify_password(payload.old_password, user.get("PasswordHash", "")):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")

    if not update_fields:
        return format_user(user)

    updated_user = auth_service.update_user(user_id, update_fields)
    return format_user(updated_user)


@router.post("/me/avatar", summary="Upload avatar cho người dùng đang đăng nhập")
async def upload_avatar(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token_data = security.decode_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")

    user_id = token_data.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    avatar_url = await storage_service.upload_avatar_file(file, user_id)
    updated_user = auth_service.update_user(user_id, {"AvatarUrl": avatar_url})

    return {
        "message": "Upload avatar thành công",
        "avatar_url": avatar_url,
        "user": format_user(updated_user)
    }

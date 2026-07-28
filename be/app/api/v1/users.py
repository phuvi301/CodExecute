from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.user import UserUpdate, AdminUserUpdate
from app.services import auth_service, storage_service, follow_service, notification_service, posts_service
from app.core import security
from app.core.dependencies import require_admin

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)

def format_user_profile(user: dict, current_user_id: str = None):
    target_user_id = user.get("UserID")
    raw_avatar = user.get("AvatarUrl", "")

    is_self = bool(current_user_id and current_user_id == target_user_id)
    
    can_edit = is_self
    can_follow = not is_self
    
    if is_self:
        is_following = False
    elif current_user_id:
        is_following = follow_service.is_following(current_user_id, target_user_id)
    else:
        is_following = False

    follow_counts = follow_service.get_follow_counts(target_user_id)

    return {
        "user_id": target_user_id,
        "email": user.get("Email"),
        "full_name": user.get("FullName", ""),
        "avatar_url": storage_service.get_public_avatar_url(raw_avatar),
        "title": user.get("Title", "Unknown"),
        "address": user.get("Address", "Unknown"),
        "bio": user.get("Bio", ""),
        "created_at": user.get("CreatedAt", "2023-03-15T00:00:00Z"),
        "role": user.get("Role", "user"),
        "can_edit": can_edit,
        "can_follow": can_follow,
        "is_following": is_following,
        "followers_count": follow_counts["followers_count"],
        "following_count": follow_counts["following_count"],
    }

@router.get("/admin/all", summary="Get all users list (Admin Only)")
async def admin_get_all_users(
    current_admin: dict = Depends(require_admin)
):
    """Admin retrieves a list of all registered users"""
    users = auth_service.get_all_users()
    formatted = []
    for u in users:
        formatted.append({
            "user_id": u.get("UserID"),
            "email": u.get("Email"),
            "full_name": u.get("FullName", ""),
            "avatar_url": storage_service.get_public_avatar_url(u.get("AvatarUrl", "")),
            "role": u.get("Role", "user"),
            "title": u.get("Title", ""),
            "address": u.get("Address", ""),
            "bio": u.get("Bio", ""),
            "created_at": u.get("CreatedAt", "")
        })
    return formatted

@router.patch("/admin/{user_id}", summary="Admin edit profile and role of another user")
async def admin_update_user_endpoint(
    user_id: str,
    payload: AdminUserUpdate,
    current_admin: dict = Depends(require_admin)
):
    """Admin updates any information or role of a target user"""
    target_user = auth_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_dict = payload.dict(exclude_unset=True)

    if payload.new_password:
        try:
            security.validate_password_strength(payload.new_password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        update_dict["password_hash"] = security.hash_password(payload.new_password)
        del update_dict["new_password"]

    updated = auth_service.admin_update_user(user_id, update_dict)
    return format_user_profile(updated, current_user_id=current_admin.get("UserID"))

@router.get("/{user_id}", summary="Get user profile by User ID")
async def get_user_profile(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    current_user_id = None
    if credentials and credentials.credentials:
        payload = security.decode_token(credentials.credentials)
        if payload:
            current_user_id = payload.get("sub")

    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return format_user_profile(user, current_user_id=current_user_id)

@router.post("/{user_id}/follow", summary="Follow user")
async def follow_user_endpoint(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = security.decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")

    current_user_id = payload.get("sub")
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_user = auth_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    follow_service.follow_user(current_user_id, user_id)

    sender_user = auth_service.get_user_by_id(current_user_id)
    if sender_user and current_user_id != user_id:
        notification_service.create_notification(
            recipient_id=user_id,
            sender=sender_user,
            notif_type="FOLLOW",
            content="started following you"
        )

    return format_user_profile(target_user, current_user_id=current_user_id)

@router.post("/{user_id}/unfollow", summary="Unfollow user")
async def unfollow_user_endpoint(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = security.decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")

    current_user_id = payload.get("sub")
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot unfollow yourself")

    target_user = auth_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    follow_service.unfollow_user(current_user_id, user_id)
    return format_user_profile(target_user, current_user_id=current_user_id)

@router.get("/{user_id}/followers", summary="Get user followers")
async def get_user_followers(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    current_user_id = None
    if credentials and credentials.credentials:
        payload = security.decode_token(credentials.credentials)
        if payload:
            current_user_id = payload.get("sub")

    follower_items = follow_service.get_followers(user_id)
    result = []
    for item in follower_items:
        f_id = item.get("FollowerID")
        if not f_id:
            continue
        u = auth_service.get_user_by_id(f_id)
        if u:
            result.append(format_user_profile(u, current_user_id=current_user_id))
    return result

@router.get("/{user_id}/following", summary="Get users followed by user")
async def get_user_following(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    current_user_id = None
    if credentials and credentials.credentials:
        payload = security.decode_token(credentials.credentials)
        if payload:
            current_user_id = payload.get("sub")

    following_items = follow_service.get_following(user_id)
    result = []
    for item in following_items:
        fg_id = item.get("FollowingID")
        if not fg_id:
            continue
        u = auth_service.get_user_by_id(fg_id)
        if u:
            result.append(format_user_profile(u, current_user_id=current_user_id))
    return result

@router.get("/{user_id}/posts", summary="Get user's created and reposted posts")
async def get_user_posts_endpoint(
    user_id: str
):
    target_user = auth_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    return posts_service.get_user_posts(user_id)

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
            raise HTTPException(status_code=400, detail="Current password is required when changing password")
        if not security.verify_password(payload.old_password, user.get("PasswordHash", "")):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        try:
            security.validate_password_strength(payload.new_password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        update_fields["PasswordHash"] = security.hash_password(payload.new_password)
    elif payload.old_password and payload.old_password.strip():
        if not security.verify_password(payload.old_password, user.get("PasswordHash", "")):
            raise HTTPException(status_code=400, detail="Incorrect current password")

    if not update_fields:
        return format_user_profile(user, current_user_id=user_id)

    updated_user = auth_service.update_user(user_id, update_fields)
    return format_user_profile(updated_user, current_user_id=user_id)

@router.post("/me/avatar", summary="Upload avatar for current user")
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
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url,
        "user": format_user_profile(updated_user, current_user_id=user_id)
    }

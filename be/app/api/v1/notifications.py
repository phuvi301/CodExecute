from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from app.services import auth_service, notification_service
from app.core import security

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)

def get_current_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token_data = security.decode_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    
    user_id = token_data.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class MarkReadPayload(BaseModel):
    created_at: str

@router.get("", summary="Get user notifications and unread count")
async def get_notifications(
    limit: int = 30,
    user: dict = Depends(get_current_user_from_token)
):
    user_id = user.get("UserID")
    return notification_service.get_user_notifications(user_id=user_id, limit=limit)

@router.patch("/read", summary="Mark a single notification as read")
async def mark_notification_read(
    payload: MarkReadPayload,
    user: dict = Depends(get_current_user_from_token)
):
    user_id = user.get("UserID")
    success = notification_service.mark_as_read(user_id=user_id, created_at=payload.created_at)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark notification as read")
    return {"message": "Notification marked as read"}

@router.patch("/read-all", summary="Mark all notifications as read")
async def mark_all_notifications_read(
    user: dict = Depends(get_current_user_from_token)
):
    user_id = user.get("UserID")
    notification_service.mark_all_as_read(user_id=user_id)
    return {"message": "All notifications marked as read"}

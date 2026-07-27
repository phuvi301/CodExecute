from fastapi import APIRouter
from app.services import storage_service

router = APIRouter()

@router.get("/avatars/{user_id}/{filename}", summary="Phục vụ ảnh avatar trực tiếp cho trình duyệt")
async def get_avatar(user_id: str, filename: str):
    return await storage_service.get_avatar_image_response(user_id, filename)

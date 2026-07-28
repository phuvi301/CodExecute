from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import search_service
from app.core import security

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)

@router.get("", summary="Tìm kiếm tổng hợp bài toán và người dùng")
async def search_all(
    q: str = Query("", description="Từ khóa tìm kiếm"),
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
):
    current_user_id = None
    if credentials and credentials.credentials:
        payload = security.decode_token(credentials.credentials)
        if payload:
            current_user_id = payload.get("sub")

    return search_service.search_all(query=q, current_user_id=current_user_id)

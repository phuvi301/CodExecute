import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service
from app.core import security

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    if auth_service.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    try:
        security.validate_password_strength(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    hashed_password = security.hash_password(payload.password)
    user_data = {
        "UserID": str(uuid.uuid4()),
        "Email": payload.email,
        "PasswordHash": hashed_password,
        "FullName": payload.full_name,
        "Title": "Full Stack Engineer",
        "Address": "San Francisco, CA",
        "Bio": "Competitive Programmer & Software Developer",
        "CreatedAt": datetime.utcnow().isoformat(),
        "Role": "user"
    }
    new_user = auth_service.create_user(user_data)
    
    return {"message": "Đăng ký thành công", "user_id": new_user['UserID']}

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response):
    user = auth_service.get_user_by_email(payload.email)
    if not user or not security.verify_password(payload.password, user['PasswordHash']):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
        
    refresh_token = security.create_token(data={"sub": user['UserID'], "role": user.get('Role', 'user')}, mode="refresh")
    access_token = security.create_token(data={"sub": user['UserID'], "role": user.get('Role', 'user')}, mode="access")
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer(auto_error=False)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
    
    payload = security.decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
    user_id = payload.get("sub")
    role = payload.get("role", "user")
    new_access_token = security.create_token(data={"sub": user_id, "role": role}, mode="access")
    return {"access_token": new_access_token, "token_type": "bearer"}

from app.services import auth_service, storage_service

@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    payload = security.decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
    user_id = payload.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    raw_avatar = user.get("AvatarUrl", "")
    return {
        "user_id": user.get("UserID"),
        "email": user.get("Email"),
        "full_name": user.get("FullName", ""),
        "avatar_url": storage_service.get_public_avatar_url(raw_avatar),
        "title": user.get("Title", "Full Stack Engineer"),
        "address": user.get("Address", "San Francisco, CA"),
        "bio": user.get("Bio", ""),
        "created_at": user.get("CreatedAt", "2023-03-15T00:00:00Z"),
        "role": user.get("Role", "user")
    }
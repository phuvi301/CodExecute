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
    
    # Lưu Refresh Token vào HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Đổi thành True trên Production (HTTPS)
        samesite="lax",
        path="/"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token không tồn tại trong cookie")
    
    payload = security.decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token không hợp lệ hoặc đã hết hạn")

    user_id = payload.get("sub")
    role = payload.get("role", "user")

    # Tạo Access Token mới & gia hạn Refresh Token (Token Rotation)
    new_access_token = security.create_token(data={"sub": user_id, "role": role}, mode="access")
    new_refresh_token = security.create_token(data={"sub": user_id, "role": role}, mode="refresh")

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/"
    )

    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    """Xóa HTTP-only cookie refresh_token khi người dùng đăng xuất"""
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Đăng xuất thành công"}
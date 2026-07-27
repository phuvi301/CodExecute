import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service
from app.core import security

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    # 1. Kiểm tra email đã tồn tại chưa
    if auth_service.get_user_by_email(payload.email):
        # details = auth_service.users_table.scan()
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    # 2. Hash mật khẩu và lưu user vào DynamoDB
    hashed_password = security.hash_password(payload.password)
    user_data = {
        "UserID": str(uuid.uuid4()),  # Tạo UUID cho UserID
        "Email": payload.email,
        "PasswordHash": hashed_password,
        "FullName": payload.full_name,
        "Role": "user"
    }
    new_user = auth_service.create_user(user_data)
    
    return {"message": "Đăng ký thành công", "user_id": new_user['UserID']}

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response):
    user = auth_service.get_user_by_email(payload.email)
    if not user or not security.verify_password(payload.password, user['PasswordHash']):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
        
    # Tạo JWT Access Token
    refresh_token = security.create_token(data={"sub": user['UserID'], "role": user.get('Role', 'user')}, mode="refresh")
    access_token = security.create_token(data={"sub": user['UserID'], "role": user.get('Role', 'user')}, mode="access")
    
    # Lưu Refresh Token vào HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Trên production, set True để chỉ cho phép HTTPS
        samesite="lax"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
    
    # Giải mã Refresh Token
    payload = security.decode_token(refresh_token)
    user_id = payload.get("sub")
    role = payload.get("role", "user")
    # Tạo Access Token mới
    new_access_token = security.create_token(data={"sub": user_id, "role": role}, mode="access")
    return {"access_token": new_access_token, "token_type": "bearer"}
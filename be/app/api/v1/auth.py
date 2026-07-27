import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service
from app.core import security

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    # 1. Kiểm tra email đã tồn tại chưa
    if auth_service.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")
    
    # 2. Hash mật khẩu và lưu user vào DynamoDB
    hashed_password = security.hash_password(payload.password)
    user_data = {
        "UserID": str(uuid.uuid4()),  # Tạo UUID cho UserID
        "Email": payload.email,
        "PasswordHash": hashed_password,
        "FullName": payload.full_name
    }
    new_user = auth_service.create_user(user_data)
    
    return {"message": "Đăng ký thành công", "user_id": new_user['UserID']}

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = auth_service.get_user_by_email(payload.email)
    if not user or not security.verify_password(payload.password, user['PasswordHash']):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
        
    # Tạo JWT Access Token
    access_token = security.create_access_token(data={"sub": user['UserID'], "role": user.get('Role', 'user')})
    return {"access_token": access_token, "token_type": "bearer"}
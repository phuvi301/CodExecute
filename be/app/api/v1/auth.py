import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, SendOTPRequest, VerifyOTPRequest
from app.services import auth_service, otp_service, email_service
from app.core import security

router = APIRouter()

@router.post("/send-otp")
async def send_otp(payload: SendOTPRequest):
    """
    Tạo và gửi mã OTP xác thực tới email người dùng.
    """
    if auth_service.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng cho một tài khoản khác")

    otp_code = otp_service.generate_otp(payload.email)
    sent = email_service.send_otp_email(payload.email, otp_code)
    
    if not sent:
        raise HTTPException(status_code=500, detail="Không thể gửi email OTP, vui lòng thử lại sau")

    return {
        "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
        "email": payload.email
    }

@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPRequest):
    """
    Xác thực mã OTP nhập vào bởi người dùng.
    """
    is_valid = otp_service.verify_otp(payload.email, payload.otp_code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn")

    return {"message": "Xác thực email thành công", "verified": True}

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    if auth_service.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    if payload.otp_code:
        is_valid = otp_service.verify_otp(payload.email, payload.otp_code)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn")

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
        "Title": "Unknown",
        "Address": "Unknown",

        "Bio": "",
        "CreatedAt": datetime.utcnow().isoformat(),
        "Role": "user",
        "IsEmailVerified": True
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

    # Tạo Access Token mới
    new_access_token = security.create_token(data={"sub": user_id, "role": role}, mode="access")

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

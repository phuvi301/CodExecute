from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
import re
import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Khởi tạo context hash mật khẩu bằng thuật toán Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- 1. XỬ LÝ MẬT KHẨU ---

def validate_password_strength(password: str) -> None:
    """Xác thực độ mạnh của mật khẩu: >=8 ký tự, ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt"""
    if len(password) < 8:
        raise ValueError("Mật khẩu phải có ít nhất 8 ký tự")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa")
    if not re.search(r'[0-9]', password):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ số")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-\=\+\[\]\\\/]', password):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*)")


def hash_password(password: str) -> str:
    """Mã hóa mật khẩu từ dạng plain text thành chuỗi Hash an toàn"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """So sánh mật khẩu người dùng nhập vào với mật khẩu đã hash trong DB"""
    return pwd_context.verify(plain_password, hashed_password)


# --- 2. XỬ LÝ JWT TOKEN ---

def create_token(data: Dict[str, Any], mode: Optional[str] = None) -> str:
    """
    Tạo chuỗi JWT Token.
    `data` thường chứa: {"sub": user_id, "role": "user"}
    """
    to_encode = data.copy()

    # Tính thời điểm hết hạn (Expiration Time)
    if mode == "refresh":
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Tiến hành ký chữ ký số và mã hóa thành JWT
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Giải mã JWT Token. 
    Trả về Payload nếu hợp lệ, trả về None nếu Token bị sửa đổi hoặc hết hạn.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        # Token đã hết hạn
        return None
    except jwt.InvalidTokenError:
        # Token không hợp lệ / bị giả mạo
        return None
import time
import secrets
from typing import Dict, Any, Optional

# Lưu trữ OTP tạm thời trong bộ nhớ server
# Structure: { email: {"code": "123456", "expires_at": timestamp, "attempts": 0} }
_otp_store: Dict[str, Dict[str, Any]] = {}

OTP_EXPIRY_SECONDS = 300  # 5 phút
MAX_ATTEMPTS = 5

def generate_otp(email: str) -> str:
    """
    Tạo mã OTP 6 chữ số và lưu với thời gian hết hạn 5 phút.
    """
    email_clean = email.strip().lower()
    # Tạo mã 6 chữ số ngẫu nhiên an toàn bảo mật
    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = time.time() + OTP_EXPIRY_SECONDS

    _otp_store[email_clean] = {
        "code": code,
        "expires_at": expires_at,
        "attempts": 0
    }
    return code

def verify_otp(email: str, code: str) -> bool:
    """
    Xác thực mã OTP gửi từ client. Trả về True nếu chính xác và chưa hết hạn.
    """
    email_clean = email.strip().lower()
    record = _otp_store.get(email_clean)

    if not record:
        return False

    # Kiểm tra hết hạn
    if time.time() > record["expires_at"]:
        _otp_store.pop(email_clean, None)
        return False

    # Kiểm tra vượt số lần thử cho phép
    if record["attempts"] >= MAX_ATTEMPTS:
        _otp_store.pop(email_clean, None)
        return False

    if record["code"] == code.strip():
        # Mã chính xác -> xóa OTP để tránh dùng lại
        _otp_store.pop(email_clean, None)
        return True
    else:
        record["attempts"] += 1
        return False

def get_otp_ttl(email: str) -> int:
    """
    Lấy số giây còn lại của mã OTP.
    """
    email_clean = email.strip().lower()
    record = _otp_store.get(email_clean)
    if not record:
        return 0
    remaining = int(record["expires_at"] - time.time())
    return max(0, remaining)

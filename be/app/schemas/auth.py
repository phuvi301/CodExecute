import re
from pydantic import BaseModel, field_validator
from typing import Optional

EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

def sanitize_and_validate_email(v: str) -> str:
    if not v:
        raise ValueError("Email không được để trống")
    sanitized = v.strip().lower()
    if not re.match(EMAIL_REGEX, sanitized):
        raise ValueError("Định dạng email không hợp lệ (ví dụ: user@domain.com)")
    return sanitized

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return sanitize_and_validate_email(v)

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    otp_code: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return sanitize_and_validate_email(v)

class SendOTPRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return sanitize_and_validate_email(v)

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return sanitize_and_validate_email(v)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    provider_id: Optional[str] = "local" # 'local', 'google', 'github'

class UserResponse(UserBase):
    user_id: str
    provider_id: str
    created_at: datetime

    class Config:
        from_attributes = True
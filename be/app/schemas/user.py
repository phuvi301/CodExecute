from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    provider_id: Optional[str] = "local" # 'local', 'google', 'github'

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    old_password: Optional[str] = None
    new_password: Optional[str] = None

class UserResponse(UserBase):
    user_id: str
    provider_id: str
    created_at: datetime

    class Config:
        from_attributes = True
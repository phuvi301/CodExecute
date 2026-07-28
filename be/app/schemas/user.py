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

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    title: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    new_password: Optional[str] = None

class UserAdminListItem(BaseModel):
    user_id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = ""
    role: str = "user"
    title: Optional[str] = ""
    address: Optional[str] = ""
    bio: Optional[str] = ""
    created_at: Optional[str] = ""

class UserResponse(UserBase):
    user_id: str
    provider_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    user_id: str
    email: EmailStr
    full_name: Optional[str] = ""
    avatar_url: Optional[str] = ""
    title: Optional[str] = ""
    address: Optional[str] = ""
    bio: Optional[str] = ""
    created_at: Optional[str] = ""
    role: Optional[str] = "user"
    can_edit: bool = False
    can_follow: bool = True
    is_following: bool = False
    followers_count: int = 0
    following_count: int = 0
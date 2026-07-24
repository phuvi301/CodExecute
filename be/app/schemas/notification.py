from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    SYSTEM = "System"
    UPVOTE = "Upvote"
    REPLY = "Reply"
    ACHIEVEMENT = "Achievement"

class NotificationBase(BaseModel):
    type: NotificationType
    message: str = Field(..., max_length=500)
    target_url: str = Field(..., description="Link trỏ tới bài viết/bài tập liên quan")

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    user_id: str
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
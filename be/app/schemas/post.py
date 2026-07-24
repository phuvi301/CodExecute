from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PostBase(BaseModel):
    title: str = Field(..., max_length=200)
    category: str = Field(..., description="Ví dụ: Interview Question, General Discussion")
    content: str = Field(..., description="Nội dung bài viết (Markdown)")
    tags: Optional[List[str]] = []

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    post_id: str
    author_id: str
    upvotes: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CodeSnippetSchema(BaseModel):
    filename: Optional[str] = "solution.py"
    language: Optional[str] = "python"
    code: str
    runtime: Optional[str] = None
    beats: Optional[str] = None

class PostCreateSchema(BaseModel):
    content: str = Field(..., min_length=1)
    type: Optional[str] = "discussion" # 'discussion', 'code-share', 'achievement'
    problem_id: Optional[str] = None
    code_snippet: Optional[CodeSnippetSchema] = None
    achievement: Optional[str] = None
    tags: Optional[List[str]] = []

class PostUpdateSchema(BaseModel):
    content: Optional[str] = Field(None, min_length=1)

class CommentCreateSchema(BaseModel):
    content: str = Field(..., min_length=1)

class CommentResponseSchema(BaseModel):
    comment_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = ""
    content: str
    created_at: str

class PostResponseSchema(BaseModel):
    post_id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = ""
    author_title: Optional[str] = ""
    content: str
    type: str
    problem_id: Optional[str] = None
    code_snippet: Optional[Dict[str, Any]] = None
    achievement: Optional[str] = None
    tags: List[str] = []
    created_at: str
    likes_count: int = 0
    liked_by: List[str] = []
    reposts_count: int = 0
    reposted_by: List[str] = []
    comments: List[CommentResponseSchema] = []
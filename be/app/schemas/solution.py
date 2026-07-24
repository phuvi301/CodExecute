from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.submission import LanguageEnum

class SolutionBase(BaseModel):
    title: str = Field(..., max_length=200)
    language: LanguageEnum
    code: str
    explanation: str = Field(..., description="Giải thích thuật toán (Markdown)")
    is_official: bool = Field(default=False)

class SolutionCreate(SolutionBase):
    pass

class SolutionResponse(SolutionBase):
    problem_id: str
    solution_id: str
    author_id: str
    upvotes: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class ProblemBase(BaseModel):
    title: str = Field(..., max_length=200)
    difficulty: DifficultyEnum
    category: str = Field(..., description="Ví dụ: Array, String, Dynamic Programming")
    time_limit: float = Field(default=2.0, description="Giới hạn thời gian (giây)")
    memory_limit: int = Field(default=256, description="Giới hạn bộ nhớ (MB)")

class ProblemCreate(ProblemBase):
    description: str = Field(..., description="Nội dung đề bài (Markdown)")
    constraints: str = Field(..., description="Ràng buộc (Markdown/Text)")

class ProblemResponse(ProblemBase):
    problem_id: str
    description: str
    constraints: str
    acceptance_rate: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
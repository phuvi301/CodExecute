from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class SubmissionStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"
    RUNTIME_ERROR = "Runtime Error"
    COMPILATION_ERROR = "Compilation Error"

class LanguageEnum(str, Enum):
    PYTHON = "python"
    CPP = "cpp"
    JAVA = "java"
    JAVASCRIPT = "javascript"

class SubmissionBase(BaseModel):
    problem_id: str
    language: LanguageEnum
    code: str

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    submission_id: str
    user_id: str
    status: SubmissionStatus = SubmissionStatus.PENDING
    execution_time: Optional[float] = Field(None, description="Thời gian chạy thực tế (giây)")
    memory_used: Optional[float] = Field(None, description="Bộ nhớ đã dùng (MB)")
    submitted_at: datetime

    class Config:
        from_attributes = True
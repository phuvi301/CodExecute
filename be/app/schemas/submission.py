from pydantic import BaseModel, Field
from typing import Optional, Union
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
    execution_time: Optional[float] = Field(0.0, description="Thời gian chạy thực tế (giây)")
    memory_used: Optional[float] = Field(0.0, description="Bộ nhớ đã dùng (MB)")
    passed_testcases: Optional[int] = Field(0, description="Số testcase đã vượt qua")
    total_testcases: Optional[int] = Field(0, description="Tổng số testcase")
    error_message: Optional[str] = Field(None, description="Chi tiết lỗi nếu có (Compile Error, Diff...)")
    submitted_at: Optional[str] = None

    class Config:
        from_attributes = True
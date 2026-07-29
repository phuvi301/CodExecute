from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class DifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class TestCaseBase(BaseModel):
    is_sample: bool = True
    input: str
    output: str

class TestCaseCreate(TestCaseBase):
    testcase_id: Optional[str] = None

class TestCaseResponse(TestCaseBase):
    testcase_id: str
    problem_id: Optional[str] = None

class ProblemBase(BaseModel):
    title: str = Field(..., max_length=200)
    difficulty: DifficultyEnum
    category: str = Field(..., description="Ví dụ: Array & Hash Table, String, Dynamic Programming")
    time_limit: float = Field(default=2.0, description="Giới hạn thời gian (giây)")
    memory_limit: int = Field(default=256, description="Giới hạn bộ nhớ (MB)")
    time_complexity: Optional[str] = Field(default="", description="Ví dụ: O(N log N)")
    space_complexity: Optional[str] = Field(default="", description="Ví dụ: O(N)")
    init_code: Optional[Dict[str, str]] = Field(default=None, description="Mã khởi tạo mẫu cho các ngôn ngữ (python, javascript, cpp, java)")

class ProblemCreate(ProblemBase):
    problem_id: Optional[str] = Field(default=None, description="Tùy chọn Custom ID (VD: two-sum) hoặc tự sinh UUID")
    description: str = Field(..., description="Nội dung đề bài (Markdown)")
    constraints: str = Field(..., description="Ràng buộc (Markdown/Text)")
    testcases: Optional[List[TestCaseCreate]] = []

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[DifficultyEnum] = None
    category: Optional[str] = None
    time_limit: Optional[float] = None
    memory_limit: Optional[int] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    description: Optional[str] = None
    constraints: Optional[str] = None
    init_code: Optional[Dict[str, str]] = None
    testcases: Optional[List[TestCaseCreate]] = None

class ProblemResponse(ProblemBase):
    problem_id: str
    description: str
    constraints: str
    acceptance_rate: float = 0.0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class ProblemAdminDetailResponse(ProblemResponse):
    testcases: List[TestCaseResponse] = []
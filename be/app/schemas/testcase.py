from pydantic import BaseModel, Field
from typing import Optional

class TestCaseBase(BaseModel):
    is_sample: bool = Field(default=False, description="True nếu là testcase mẫu hiển thị cho user")
    input_preview: Optional[str] = Field(None, description="Chuỗi input ngắn gọn hiển thị trên UI")
    output_preview: Optional[str] = Field(None, description="Chuỗi output ngắn gọn hiển thị trên UI")

class TestCaseCreate(TestCaseBase):
    s3_input_key: str = Field(..., description="Đường dẫn file .in trên S3")
    s3_output_key: str = Field(..., description="Đường dẫn file .out trên S3")

class TestCaseResponse(TestCaseBase):
    problem_id: str
    testcase_id: str
    # Có thể trả về hoặc ẩn s3_keys tùy vào việc bạn muốn frontend biết hay không
    s3_input_key: str 
    s3_output_key: str

    class Config:
        from_attributes = True
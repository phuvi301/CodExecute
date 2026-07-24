import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Cấu hình Chung
    PROJECT_NAME: str = "CodeMaster API"
    ENVIRONMENT: str = "development"
    
    # Cấu hình AWS
    AWS_REGION: str = "ap-southeast-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    
    # Cấu hình Tên các bảng DynamoDB
    DYNAMODB_USERS_TABLE: str = "Users"
    DYNAMODB_SUBMISSIONS_TABLE: str = "Submissions"
    DYNAMODB_TESTCASES_TABLE: str = "TestCases"
    DYNAMODB_NOTIFICATIONS_TABLE: str = "Notifications"
    DYNAMODB_POSTS_TABLE: str = "Posts"
    
    # Cấu hình SQS & S3
    SQS_QUEUE_URL: str = ""
    S3_TESTCASE_BUCKET: str = "codemaster-testcases-bucket"
    
    # Cấu hình JWT Security
    JWT_SECRET_KEY: str = "super-secret-key-for-local-dev-only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 giờ

    # Tự động nạp các biến từ file .env nếu có
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Khởi tạo instance duy nhất để dùng trong toàn bộ app
settings = Settings()
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Cấu hình Chung
    PROJECT_NAME: str = "CodExecute API"
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
    DYNAMODB_PROBLEMS_TABLE: str = "Problems"
    DYNAMODB_FOLLOWS_TABLE: str = "UserFollows"
    
    # Cấu hình SQS & S3
    SQS_QUEUE_URL: str = ""
    S3_TESTCASE_BUCKET: str = "codeexecute-testcases"
    S3_AVATAR_BUCKET: str = "codeexecuter-user-media"
    UPLOAD_DIR: str = "uploads"
    
    # Cấu hình JWT Security
    JWT_SECRET_KEY: str = "super-secret-key-for-local-dev-only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 giờ
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 ngày

    # Cấu hình AWS ECS Task Execution
    EXECUTION_MODE: str = "tmp" # "ecs" hoặc "tmp" (local / mô phỏng)
    ECS_CLUSTER_NAME: str = "codeexecute-cluster"
    ECS_TASK_DEFINITION: str = "codeexecute-runner-task"
    ECS_CONTAINER_NAME: str = "codeexecute-runner"
    ECS_SUBNET_IDS: str = "" # Danh sách subnet IDs phân tách bởi dấu phẩy, vd: "subnet-1,subnet-2"
    ECS_SECURITY_GROUP_IDS: str = "" # Danh sách security group IDs phân tách bởi dấu phẩy
    ECS_LOG_GROUP_NAME: str = "/ecs/codeexecute-runner"

    # Cấu hình SMTP Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "noreply@codexecute.com"
    SMTP_TLS: bool = True

    # Cấu hình OAuth Google & GitHub
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/callback"

    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_REDIRECT_URI: str = "http://localhost:5173/auth/callback"

    # Tự động nạp các biến từ file .env nếu có
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Khởi tạo instance duy nhất để dùng trong toàn bộ app
settings = Settings()
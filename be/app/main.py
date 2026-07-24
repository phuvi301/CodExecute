from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# 1. Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="CodExecute API",
    description="Backend API cho hệ thống Online Judge tích hợp DynamoDB, S3 & SQS",
    version="1.0.0",
    docs_url="/docs",      # Đường dẫn xem Swagger UI
    redoc_url="/redoc"     # Đường dẫn xem ReDoc
)

# 2. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vào Production thì đổi thành domain Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Đăng ký các API Routers
# từ các file trong app/api/v1/
app.include_router(api_router, prefix="/api/v1")

# 4. Route kiểm tra trạng thái Server (Health Check)
@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "message": "Online Judge API đang hoạt động bình thường!"
    }
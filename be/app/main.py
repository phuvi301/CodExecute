import os
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router

# Cấu hình Logger chuẩn hiển thị ngay lập tức level INFO ra Terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

app = FastAPI(
    title="CodExecute API",
    description="Backend API cho hệ thống Online Judge tích hợp DynamoDB, S3 & SQS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.CLOUDFRONT_DOMAIN:
    cf_url = settings.CLOUDFRONT_DOMAIN.rstrip("/")
    if cf_url not in allowed_origins:
        allowed_origins.append(cf_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "message": "Online Judge API đang hoạt động bình thường!"
    }
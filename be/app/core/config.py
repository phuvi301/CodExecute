import os

class Settings:
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    
    # Chuỗi Secret Key dùng để ký chữ ký số JWT (Cực kỳ quan trọng, tuyệt đối không hard-code)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-me-in-production")
    
    # Thuật toán mã hóa JWT
    JWT_ALGORITHM: str = "HS256"
    
    # Thời gian sống của Token (tính theo phút) - ví dụ 24 giờ = 1440 phút
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

settings = Settings()
import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.core.aws import s3_client
from app.core.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def upload_avatar_file(file: UploadFile, user_id: str) -> str:
    """
    Xử lý kiểm tra và upload avatar của user.
    Ưu tiên tải lên AWS S3. Nếu không cấu hình AWS hoặc bị lỗi, tự động lưu vào ổ đĩa local.
    """
    # 1. Kiểm tra loại file
    content_type = file.content_type.lower() if file.content_type else ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hợp lệ. Chỉ chấp nhận các tệp ảnh (JPEG, PNG, WEBP, GIF, SVG)."
        )

    # 2. Đọc nội dung file & kiểm tra dung lượng
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dung lượng tệp vượt quá giới hạn tối đa (5MB)."
        )

    # 3. Tạo tên file duy nhất
    ext = ALLOWED_IMAGE_TYPES[content_type]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    s3_key = f"avatars/{user_id}/{unique_filename}"

    # 4. Thử tải lên S3
    try:
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            s3_client.put_object(
                Bucket=settings.S3_AVATAR_BUCKET,
                Key=s3_key,
                Body=contents,
                ContentType=content_type
            )
            if settings.AWS_ENDPOINT_URL:
                avatar_url = f"{settings.AWS_ENDPOINT_URL.rstrip('/')}/{settings.S3_AVATAR_BUCKET}/{s3_key}"
            else:
                avatar_url = f"https://{settings.S3_AVATAR_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            return avatar_url
    except Exception as e:
        # Nếu S3 thất bại (ví dụ credentials dev giả lập hoặc bucket chưa tồn tại), fallback về local storage
        pass

    # 5. Fallback: Lưu file vào local storage (uploads/avatars)
    local_dir = os.path.join(settings.UPLOAD_DIR, "avatars", user_id)
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, unique_filename)

    with open(local_path, "wb") as f:
        f.write(contents)

    avatar_url = f"/static/avatars/{user_id}/{unique_filename}"
    return avatar_url

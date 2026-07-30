import os
import uuid
import logging
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import Response, FileResponse
from app.core.aws import s3_client
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def delete_old_avatar_files(user_id: str):
    """
    Tự động xóa tất cả tệp avatar cũ của user_id trong thư mục avatars trên S3 và local storage.
    """
    # 1. Xóa ảnh cũ trên S3 (kiểm tra mọi tệp bắt đầu bằng avatars/user_id)
    try:
        prefix = f"avatars/{user_id}"
        response = s3_client.list_objects_v2(
            Bucket=settings.S3_AVATAR_BUCKET,
            Prefix=prefix
        )
        if "Contents" in response:
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            if objects_to_delete:
                s3_client.delete_objects(
                    Bucket=settings.S3_AVATAR_BUCKET,
                    Delete={'Objects': objects_to_delete}
                )
                logger.info(f"Deleted old S3 avatar objects for user {user_id}: {objects_to_delete}")
    except Exception as e:
        logger.warning(f"Failed to delete old S3 avatar objects for user {user_id}: {e}")

    # 2. Xóa ảnh cũ trên Local storage (nếu có)
    local_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    if os.path.exists(local_dir):
        for fname in os.listdir(local_dir):
            if fname.startswith(user_id):
                try:
                    os.remove(os.path.join(local_dir, fname))
                except Exception:
                    pass


def get_public_avatar_url(raw_url: str) -> str:
    """
    Chuyển đổi đường dẫn avatar (S3 key hoặc direct S3 URL) 
    thành Presigned URL S3.
    """
    if not raw_url:
        return ""
    
    # Nếu đã là URL từ domain khác không phải S3 và không chứa path avatars
    if "avatars/" not in raw_url:
        return raw_url

    # Trích xuất S3 key (ví dụ: avatars/user_id.png hoặc avatars/user_id/file.png)
    s3_key = f"avatars/{raw_url.split('avatars/')[1].split('?')[0]}"

    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_AVATAR_BUCKET, 'Key': s3_key},
            ExpiresIn=604800 # 7 ngày
        )
        return presigned_url
    except Exception as e:
        logger.error(f"Failed to generate direct S3 presigned URL for {s3_key}: {e}")

    return raw_url


async def upload_avatar_file(file: UploadFile, user_id: str) -> str:
    """
    Xử lý kiểm tra và upload avatar lên AWS S3.
    Lưu trực tiếp vào folder 'avatars/' với tên file trùng với userID ({user_id}{ext}).
    Khi có ảnh mới, tự động xóa ảnh cũ của người dùng trước khi thay thế.
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

    # 3. Tạo tên file trực tiếp là userID và đuôi mở rộng
    ext = ALLOWED_IMAGE_TYPES[content_type]
    filename = f"{user_id}{ext}"
    s3_key = f"avatars/{filename}"

    # 4. Tự động xóa tất cả ảnh avatar cũ của user này
    delete_old_avatar_files(user_id)

    # 5. Tải ảnh mới lên S3
    try:
        s3_client.put_object(
            Bucket=settings.S3_AVATAR_BUCKET,
            Key=s3_key,
            Body=contents,
            ContentType=content_type
        )
        logger.info(f"Successfully uploaded new avatar for user {user_id} to S3: {s3_key}")

        # Tạo URL Presigned đọc trực tiếp từ AWS S3
        avatar_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_AVATAR_BUCKET, 'Key': s3_key},
            ExpiresIn=604800
        )
        return avatar_url
    except Exception as e:
        logger.error(f"S3 Avatar Upload failed with error: {e}. Falling back to local storage.", exc_info=True)

    # 6. Local fallback (nếu S3 lỗi)
    local_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, filename)
    with open(local_path, "wb") as f:
        f.write(contents)

    base_url = settings.BACKEND_BASE_URL.rstrip("/")
    return f"{base_url}/static/avatars/{filename}"





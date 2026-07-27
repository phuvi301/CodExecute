from app.core.aws import s3_client
from app.core.config import settings
from botocore.exceptions import ClientError

def upload_testcase_file(file_content: bytes, s3_key: str) -> bool:
    """Upload dữ liệu testcase lên S3"""
    try:
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_TESTCASES,
            Key=s3_key,
            Body=file_content,
            ContentType="text/plain"
        )
        return True
    except ClientError as e:
        print(f"❌ Lỗi upload file S3: {e}")
        return False

def generate_presigned_download_url(s3_key: str, expiration: int = 3600) -> str:
    """Tạo link tải file giới hạn thời gian (dùng khi Admin cần tải testcase xem lại)"""
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.S3_BUCKET_TESTCASES, 'Key': s3_key},
        ExpiresIn=expiration
    )
import boto3
from app.core.config import settings

def _get_boto3_kwargs() -> dict:
    """Tạo dictionary cấu hình kết nối AWS linh hoạt"""
    kwargs = {"region_name": settings.AWS_REGION}

    if settings.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL

    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

    return kwargs

# --- 1. DynamoDB ---
dynamodb_resource = boto3.resource('dynamodb', **_get_boto3_kwargs())
dynamodb_client = boto3.client('dynamodb', **_get_boto3_kwargs())

# --- 2. Amazon S3 (Lưu trữ file Testcase, Avatar...) ---
s3_client = boto3.client('s3', **_get_boto3_kwargs())

# --- 3. Amazon SQS (Hàng đợi bài chấm) ---
sqs_client = boto3.client('sqs', **_get_boto3_kwargs())


def get_dynamodb_table(table_name: str):
    """Helper lấy nhanh đối tượng bảng DynamoDB"""
    return dynamodb_resource.Table(table_name)
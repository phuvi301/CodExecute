import boto3
from app.core.config import settings
from botocore.config import Config

# Cấu hình Timeout ngắn cho Boto3 (3s) để tránh bị treo vĩnh viễn khi SQS/AWS không phản hồi
boto_config = Config(
    connect_timeout=3.0,
    read_timeout=3.0,
    retries={"max_attempts": 2}
)

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
dynamodb_resource = boto3.resource('dynamodb', config=boto_config, **_get_boto3_kwargs())
dynamodb_client = boto3.client('dynamodb', config=boto_config, **_get_boto3_kwargs())

# --- 2. Amazon S3 (Lưu trữ file Testcase, Avatar...) ---
s3_client = boto3.client('s3', config=boto_config, **_get_boto3_kwargs())

# --- 3. Amazon SQS (Hàng đợi bài chấm) ---
sqs_client = boto3.client('sqs', config=boto_config, **_get_boto3_kwargs())

# --- 4. Amazon ECS & CloudWatch Logs (Thực thi code trên Container Fargate) ---
ecs_boto_config = Config(
    connect_timeout=5.0,
    read_timeout=15.0,
    retries={"max_attempts": 3}
)
ecs_client = boto3.client('ecs', config=ecs_boto_config, **_get_boto3_kwargs())
logs_client = boto3.client('logs', config=ecs_boto_config, **_get_boto3_kwargs())


def get_dynamodb_table(table_name: str):
    """Helper lấy nhanh đối tượng bảng DynamoDB"""
    return dynamodb_resource.Table(table_name)
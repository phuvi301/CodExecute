import boto3
from botocore.config import Config
from app.core.config import settings

boto_config = Config(
    connect_timeout=3,
    read_timeout=3,
    retries={"max_attempts": 2}
)

def _get_boto3_kwargs():
    kwargs = {
        "region_name": settings.AWS_REGION,
    }
    return kwargs

# DynamoDB
dynamodb_resource = boto3.resource(
    "dynamodb",
    config=boto_config,
    **_get_boto3_kwargs()
)

dynamodb_client = boto3.client(
    "dynamodb",
    config=boto_config,
    **_get_boto3_kwargs()
)

# S3
s3_client = boto3.client(
    "s3",
    config=boto_config,
    **_get_boto3_kwargs()
)

# SQS
sqs_client = boto3.client(
    "sqs",
    config=boto_config,
    **_get_boto3_kwargs()
)


def get_dynamodb_table(table_name: str):
    return dynamodb_resource.Table(table_name)
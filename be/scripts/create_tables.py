from pathlib import Path
import sys

# Thêm thư mục cha (FCAJ) vào sys.path để Python nhận diện được package 'app'
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

# Khởi tạo DynamoDB Resource (Lấy credentials từ aws configure)
dynamodb = boto3.resource('dynamodb', region_name=settings.AWS_REGION)


def create_users_table():
    try:
        table = dynamodb.create_table(
            TableName=settings.DYNAMODB_USERS_TABLE,
            KeySchema=[
                {'AttributeName': 'UserID', 'KeyType': 'HASH'}  # Partition Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'UserID', 'AttributeType': 'S'},
                {'AttributeName': 'Email', 'AttributeType': 'S'},
                {'AttributeName': 'ProviderID', 'AttributeType': 'S'},
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'Email-index',
                    'KeySchema': [{'AttributeName': 'Email', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'}
                },
                {
                    'IndexName': 'Provider-index',
                    'KeySchema': [{'AttributeName': 'ProviderID', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Đang tạo bảng Users...")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Bảng Users đã tồn tại.")
        else:
            print(f"Lỗi tạo bảng Users: {e}")


def create_submissions_table():
    try:
        table = dynamodb.create_table(
            TableName=settings.DYNAMODB_SUBMISSIONS_TABLE,
            KeySchema=[
                {'AttributeName': 'SubmissionID', 'KeyType': 'HASH'} # Partition Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'SubmissionID', 'AttributeType': 'S'},
                {'AttributeName': 'UserID', 'AttributeType': 'S'},
                {'AttributeName': 'ProblemID', 'AttributeType': 'S'},
                {'AttributeName': 'SubmittedAt', 'AttributeType': 'S'},
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'UserSubmissions-index',
                    'KeySchema': [
                        {'AttributeName': 'UserID', 'KeyType': 'HASH'},
                        {'AttributeName': 'SubmittedAt', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                },
                {
                    'IndexName': 'ProblemSubmissions-index',
                    'KeySchema': [
                        {'AttributeName': 'ProblemID', 'KeyType': 'HASH'},
                        {'AttributeName': 'SubmittedAt', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Đang tạo bảng Submissions...")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Bảng Submissions đã tồn tại.")
        else:
            print(f"Lỗi tạo bảng Submissions: {e}")


def create_problems_table():
    try:
        dynamodb.create_table(
            TableName='Problems',
            KeySchema=[
                {'AttributeName': 'ProblemID', 'KeyType': 'HASH'} # Partition Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'ProblemID', 'AttributeType': 'S'},
                {'AttributeName': 'Difficulty', 'AttributeType': 'S'},
                {'AttributeName': 'Category', 'AttributeType': 'S'},
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'Difficulty-index',
                    'KeySchema': [
                        {'AttributeName': 'Difficulty', 'KeyType': 'HASH'},
                        {'AttributeName': 'ProblemID', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                },
                {
                    'IndexName': 'Category-index',
                    'KeySchema': [
                        {'AttributeName': 'Category', 'KeyType': 'HASH'},
                        {'AttributeName': 'ProblemID', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("✅ Đã tạo bảng Problems thành công.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("⚠️ Bảng Problems đã tồn tại.")
        else:
            print(f"❌ Lỗi tạo bảng Problems: {e}")


def create_testcases_table():
    try:
        dynamodb.create_table(
            TableName='TestCases',
            KeySchema=[
                {'AttributeName': 'ProblemID', 'KeyType': 'HASH'}, # Partition Key
                {'AttributeName': 'TestCaseID', 'KeyType': 'RANGE'} # Sort Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'ProblemID', 'AttributeType': 'S'},
                {'AttributeName': 'TestCaseID', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("✅ Đã tạo bảng TestCases thành công.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("⚠️ Bảng TestCases đã tồn tại.")
        else:
            print(f"❌ Lỗi tạo bảng TestCases: {e}")


def create_solutions_table():
    try:
        dynamodb.create_table(
            TableName='Solutions',
            KeySchema=[
                {'AttributeName': 'ProblemID', 'KeyType': 'HASH'}, # Partition Key
                {'AttributeName': 'SolutionID', 'KeyType': 'RANGE'} # Sort Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'ProblemID', 'AttributeType': 'S'},
                {'AttributeName': 'SolutionID', 'AttributeType': 'S'},
                {'AttributeName': 'AuthorID', 'AttributeType': 'S'},
                {'AttributeName': 'CreatedAt', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'AuthorSolutions-index',
                    'KeySchema': [
                        {'AttributeName': 'AuthorID', 'KeyType': 'HASH'},
                        {'AttributeName': 'CreatedAt', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("✅ Đã tạo bảng Solutions thành công.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("⚠️ Bảng Solutions đã tồn tại.")
        else:
            print(f"❌ Lỗi tạo bảng Solutions: {e}")


def create_notifications_table():
    try:
        table = dynamodb.create_table(
            TableName=settings.DYNAMODB_NOTIFICATIONS_TABLE,
            KeySchema=[
                {'AttributeName': 'UserID', 'KeyType': 'HASH'}, # Partition Key
                {'AttributeName': 'CreatedAt', 'KeyType': 'RANGE'} # Sort Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'UserID', 'AttributeType': 'S'},
                {'AttributeName': 'CreatedAt', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Đang tạo bảng Notifications...")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Bảng Notifications đã tồn tại.")
        else:
            print(f"Lỗi tạo bảng Notifications: {e}")


def create_posts_table():
    try:
        table = dynamodb.create_table(
            TableName=settings.DYNAMODB_POSTS_TABLE,
            KeySchema=[
                {'AttributeName': 'PostID', 'KeyType': 'HASH'} # Partition Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PostID', 'AttributeType': 'S'},
                {'AttributeName': 'Category', 'AttributeType': 'S'},
                {'AttributeName': 'CreatedAt', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'Feed-index',
                    'KeySchema': [
                        {'AttributeName': 'Category', 'KeyType': 'HASH'},
                        {'AttributeName': 'CreatedAt', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Đang tạo bảng Posts...")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Bảng Posts đã tồn tại.")
        else:
            print(f"Lỗi tạo bảng Posts: {e}")


def create_follows_table():
    try:
        table = dynamodb.create_table(
            TableName=settings.DYNAMODB_FOLLOWS_TABLE,
            KeySchema=[
                {'AttributeName': 'FollowerID', 'KeyType': 'HASH'},  # Partition Key
                {'AttributeName': 'FollowingID', 'KeyType': 'RANGE'} # Sort Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'FollowerID', 'AttributeType': 'S'},
                {'AttributeName': 'FollowingID', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'Following-index',
                    'KeySchema': [
                        {'AttributeName': 'FollowingID', 'KeyType': 'HASH'},
                        {'AttributeName': 'FollowerID', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Đang tạo bảng UserFollows...")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Bảng UserFollows đã tồn tại.")
        else:
            print(f"Lỗi tạo bảng UserFollows: {e}")


if __name__ == '__main__':
    print("--- BẮT ĐẦU TẠO CÁC BẢNG DYNAMODB ---")
    create_users_table()
    create_submissions_table()
    create_problems_table()
    create_testcases_table()
    create_solutions_table()
    create_notifications_table()
    create_posts_table()
    create_follows_table()
    print("--- HOÀN TẤT ---")
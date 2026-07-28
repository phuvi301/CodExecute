from datetime import datetime
from botocore.exceptions import ClientError
from app.core.aws import dynamodb_resource
from app.core.config import settings

follows_table = dynamodb_resource.Table(settings.DYNAMODB_FOLLOWS_TABLE)
users_table = dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)

def ensure_follows_table_exists():
    """Tự động kiểm tra và tạo bảng UserFollows nếu chưa tồn tại"""
    try:
        table = dynamodb_resource.create_table(
            TableName=settings.DYNAMODB_FOLLOWS_TABLE,
            KeySchema=[
                {'AttributeName': 'FollowerID', 'KeyType': 'HASH'},
                {'AttributeName': 'FollowingID', 'KeyType': 'RANGE'}
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
        table.wait_until_exists()
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceInUseException':
            print(f"Lỗi kiểm tra/tạo bảng Follows: {e}")

def is_following(follower_id: str, following_id: str) -> bool:
    if not follower_id or not following_id or follower_id == following_id:
        return False
    try:
        res = follows_table.get_item(
            Key={
                'FollowerID': follower_id,
                'FollowingID': following_id
            }
        )
        return 'Item' in res
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            ensure_follows_table_exists()
            return False
        return False

def follow_user(follower_id: str, following_id: str) -> bool:
    if follower_id == following_id:
        return False
    
    try:
        follows_table.put_item(
            Item={
                'FollowerID': follower_id,
                'FollowingID': following_id,
                'CreatedAt': datetime.utcnow().isoformat()
            }
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            ensure_follows_table_exists()
            follows_table.put_item(
                Item={
                    'FollowerID': follower_id,
                    'FollowingID': following_id,
                    'CreatedAt': datetime.utcnow().isoformat()
                }
            )
        else:
            raise e

    # Update counters in Users table
    _update_user_counter(follower_id, "FollowingCount", 1)
    _update_user_counter(following_id, "FollowersCount", 1)
    return True

def unfollow_user(follower_id: str, following_id: str) -> bool:
    if follower_id == following_id:
        return False

    try:
        follows_table.delete_item(
            Key={
                'FollowerID': follower_id,
                'FollowingID': following_id
            }
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            return False
        raise e

    _update_user_counter(follower_id, "FollowingCount", -1)
    _update_user_counter(following_id, "FollowersCount", -1)
    return True

def get_follow_counts(user_id: str) -> dict:
    followers_count = 0
    following_count = 0
    
    # Check item from Users table first
    user_res = users_table.get_item(Key={'UserID': user_id})
    user = user_res.get('Item')
    if user:
        if 'FollowersCount' in user:
            followers_count = int(user.get('FollowersCount', 0))
        else:
            # Calculate via GSI query if not stored yet
            followers_count = _count_followers_from_db(user_id)

        if 'FollowingCount' in user:
            following_count = int(user.get('FollowingCount', 0))
        else:
            # Calculate via query if not stored yet
            following_count = _count_following_from_db(user_id)
            
    return {
        "followers_count": max(0, followers_count),
        "following_count": max(0, following_count)
    }

def _count_followers_from_db(user_id: str) -> int:
    try:
        res = follows_table.query(
            IndexName='Following-index',
            KeyConditionExpression='FollowingID = :uid',
            ExpressionAttributeValues={':uid': user_id},
            Select='COUNT'
        )
        return res.get('Count', 0)
    except Exception:
        return 0

def _count_following_from_db(user_id: str) -> int:
    try:
        res = follows_table.query(
            KeyConditionExpression='FollowerID = :uid',
            ExpressionAttributeValues={':uid': user_id},
            Select='COUNT'
        )
        return res.get('Count', 0)
    except Exception:
        return 0

def _update_user_counter(user_id: str, field: str, delta: int):
    try:
        users_table.update_item(
            Key={'UserID': user_id},
            UpdateExpression=f"ADD #{field} :val",
            ExpressionAttributeNames={f"#{field}": field},
            ExpressionAttributeValues={":val": delta}
        )
    except Exception as e:
        print(f"Error updating user counter {field} for {user_id}: {e}")

from app.core.aws import dynamodb_resource
from app.core.config import settings

# Lấy instance bảng Users
users_table = dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)

def get_user_by_id(user_id: str):
    response = users_table.get_item(Key={'UserID': user_id})
    return response.get('Item')

def get_user_by_email(email: str):
    response = users_table.query(
        IndexName='Email-index',
        KeyConditionExpression='Email = :email',
        ExpressionAttributeValues={':email': email}
    )
    items = response.get('Items', [])
    return items[0] if items else None

def create_user(user_data: dict):
    users_table.put_item(Item=user_data)
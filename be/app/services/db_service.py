from app.core.aws import dynamodb
from app.core.config import settings

# Lấy instance bảng Users
users_table = dynamodb.Table(settings.DYNAMODB_USERS_TABLE)
testcases_table = dynamodb.Table(settings.DYNAMODB_TESTCASES_TABLE)

def get_user_by_id(user_id: str):
    response = users_table.get_item(Key={'UserID': user_id})
    return response.get('Item')
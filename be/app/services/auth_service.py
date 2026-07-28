from app.core.aws import dynamodb_resource
from app.core.config import settings

# Lấy instance bảng Users
users_table = dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)

def get_user_by_id(user_id: str):
    response = users_table.get_item(Key={'UserID': user_id})
    return response.get('Item')

def get_user_by_email(email: str):
    sanitized_email = email.strip().lower() if email else ""
    response = users_table.query(
        IndexName='Email-index',
        KeyConditionExpression='Email = :email',
        ExpressionAttributeValues={':email': sanitized_email}
    )
    items = response.get('Items', [])
    return items[0] if items else None

def create_user(user_data: dict):
    if 'Email' in user_data and user_data['Email']:
        user_data['Email'] = user_data['Email'].strip().lower()
    if 'IsEmailVerified' not in user_data:
        user_data['IsEmailVerified'] = True
    users_table.put_item(Item=user_data)
    return user_data

def update_user(user_id: str, update_fields: dict):
    update_expr = []
    expr_attr_values = {}
    expr_attr_names = {}

    for key, val in update_fields.items():
        if val is not None:
            attr_name = f"#{key}"
            attr_val = f":{key}"
            update_expr.append(f"{attr_name} = {attr_val}")
            expr_attr_names[attr_name] = key
            expr_attr_values[attr_val] = val

    if not update_expr:
        return get_user_by_id(user_id)

    response = users_table.update_item(
        Key={'UserID': user_id},
        UpdateExpression="SET " + ", ".join(update_expr),
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values,
        ReturnValues="ALL_NEW"
    )
    return response.get('Attributes', {})
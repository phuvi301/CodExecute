import logging
from typing import List, Dict, Any
from app.core.aws import dynamodb_resource
from app.core.config import settings

logger = logging.getLogger(__name__)

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

def create_or_get_oauth_user(oauth_info: dict) -> dict:
    import uuid
    from datetime import datetime

    email = oauth_info['email'].strip().lower()
    existing_user = get_user_by_email(email)

    if existing_user:
        # Nếu user đã có avatar hoặc chưa có avatar nhưng OAuth có -> Cập nhật avatar nếu thích hợp
        updates = {}
        if not existing_user.get("AvatarUrl") and oauth_info.get("avatar_url"):
            updates["AvatarUrl"] = oauth_info["avatar_url"]
        if updates:
            existing_user = update_user(existing_user["UserID"], updates)
        return existing_user

    # Tạo user mới từ OAuth
    user_id = str(uuid.uuid4())
    new_user_data = {
        "UserID": user_id,
        "Email": email,
        "PasswordHash": "", # Không dùng mật khẩu khi đăng nhập bằng OAuth
        "FullName": oauth_info.get("full_name") or email.split("@")[0],
        "AvatarUrl": oauth_info.get("avatar_url", ""),
        "Title": "Member",
        "Address": "Unknown",
        "Bio": f"Đăng nhập qua {oauth_info.get('provider', 'OAuth').title()}",
        "CreatedAt": datetime.utcnow().isoformat(),
        "Role": "user",
        "IsEmailVerified": True,
        "OAuthProvider": oauth_info.get("provider"),
        "OAuthProviderID": oauth_info.get("provider_id")
    }

    create_user(new_user_data)
    return new_user_data


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

def get_all_users() -> List[Dict[str, Any]]:
    """Scan tất cả người dùng cho Admin quản lý"""
    try:
        response = users_table.scan()
        return response.get("Items", [])
    except Exception as e:
        logger.error(f"Lỗi scan Users table: {e}")
        return []

def admin_update_user(user_id: str, update_data: dict) -> Dict[str, Any]:
    """Cập nhật thông tin profile và Role của người dùng bất kỳ bởi Admin"""
    field_mappings = {
        "email": "Email",
        "full_name": "FullName",
        "role": "Role",
        "title": "Title",
        "address": "Address",
        "bio": "Bio",
        "avatar_url": "AvatarUrl",
        "password_hash": "PasswordHash"
    }

    update_fields = {}
    for key, attr_name in field_mappings.items():
        if key in update_data and update_data[key] is not None:
            update_fields[attr_name] = update_data[key]

    return update_user(user_id, update_fields)
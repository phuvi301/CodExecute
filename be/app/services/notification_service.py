import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key
from app.core.aws import dynamodb_resource
from app.core.config import settings
from app.services import storage_service

notifications_table = dynamodb_resource.Table(settings.DYNAMODB_NOTIFICATIONS_TABLE)

def format_notification(item: dict) -> dict:
    raw_avatar = item.get("SenderAvatar", "")
    return {
        "notification_id": item.get("NotificationID", ""),
        "user_id": item.get("UserID", ""),
        "sender_id": item.get("SenderID", ""),
        "sender_name": item.get("SenderName", "User"),
        "sender_avatar": storage_service.get_public_avatar_url(raw_avatar),
        "type": item.get("Type", ""),
        "post_id": item.get("PostID"),
        "content": item.get("Content", ""),
        "is_read": bool(item.get("IsRead", False)),
        "created_at": item.get("CreatedAt", "")
    }

def create_notification(
    recipient_id: str,
    sender: dict,
    notif_type: str,
    content: str,
    post_id: str = None
) -> dict | None:
    sender_id = sender.get("UserID")
    
    # Do not send notification to oneself
    if not recipient_id or not sender_id or recipient_id == sender_id:
        return None

    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    sender_name = sender.get("FullName") or "Someone"
    sender_avatar = sender.get("AvatarUrl", "")

    item = {
        "UserID": recipient_id,
        "CreatedAt": created_at,
        "NotificationID": notification_id,
        "SenderID": sender_id,
        "SenderName": sender_name,
        "SenderAvatar": sender_avatar,
        "Type": notif_type,
        "Content": content,
        "IsRead": False
    }
    
    if post_id:
        item["PostID"] = post_id

    try:
        notifications_table.put_item(Item=item)
        return format_notification(item)
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None

def get_user_notifications(user_id: str, limit: int = 30) -> dict:
    if not user_id:
        return {"notifications": [], "unread_count": 0}

    try:
        response = notifications_table.query(
            KeyConditionExpression=Key('UserID').eq(user_id),
            ScanIndexForward=False,
            Limit=limit
        )
        items = response.get('Items', [])
    except Exception as e:
        print(f"Error querying notifications for user {user_id}: {e}")
        items = []

    formatted_notifs = [format_notification(item) for item in items]
    unread_count = sum(1 for item in formatted_notifs if not item["is_read"])

    return {
        "notifications": formatted_notifs,
        "unread_count": unread_count
    }

def mark_as_read(user_id: str, created_at: str) -> bool:
    if not user_id or not created_at:
        return False
    try:
        notifications_table.update_item(
            Key={
                'UserID': user_id,
                'CreatedAt': created_at
            },
            UpdateExpression="SET IsRead = :val",
            ExpressionAttributeValues={
                ':val': True
            }
        )
        return True
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return False

def mark_all_as_read(user_id: str) -> bool:
    if not user_id:
        return False
    try:
        response = notifications_table.query(
            KeyConditionExpression=Key('UserID').eq(user_id),
            FilterExpression="IsRead = :unread",
            ExpressionAttributeValues={':unread': False}
        )
        items = response.get('Items', [])
        for item in items:
            notifications_table.update_item(
                Key={
                    'UserID': user_id,
                    'CreatedAt': item['CreatedAt']
                },
                UpdateExpression="SET IsRead = :val",
                ExpressionAttributeValues={':val': True}
            )
        return True
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return False

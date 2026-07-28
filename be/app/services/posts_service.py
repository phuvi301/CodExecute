import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key
from app.core.aws import dynamodb_resource
from app.core.config import settings
from app.services import storage_service
from app.schemas.post import PostCreateSchema

posts_table = dynamodb_resource.Table(settings.DYNAMODB_POSTS_TABLE)

def format_post(item: dict) -> dict:
    raw_avatar = item.get("AuthorAvatar", "")
    comments_raw = item.get("Comments", [])
    
    formatted_comments = []
    for c in comments_raw:
        cmt_avatar = c.get("user_avatar", "")
        formatted_comments.append({
            "comment_id": c.get("comment_id", ""),
            "user_id": c.get("user_id", ""),
            "user_name": c.get("user_name", "Developer"),
            "user_avatar": storage_service.get_public_avatar_url(cmt_avatar),
            "content": c.get("content", ""),
            "created_at": c.get("created_at", "")
        })

    return {
        "post_id": item.get("PostID"),
        "author_id": item.get("AuthorID", ""),
        "author_name": item.get("AuthorName", "Developer"),
        "author_avatar": storage_service.get_public_avatar_url(raw_avatar),
        "author_title": item.get("AuthorTitle", "Developer"),
        "content": item.get("Content", ""),
        "type": item.get("Type", "discussion"),
        "code_snippet": item.get("CodeSnippet"),
        "achievement": item.get("Achievement"),
        "tags": item.get("Tags", []),
        "created_at": item.get("CreatedAt", ""),
        "likes_count": int(item.get("Likes", 0)),
        "liked_by": item.get("LikedBy", []),
        "reposts_count": int(item.get("Reposts", 0)),
        "reposted_by": item.get("RepostedBy", []),
        "comments": formatted_comments
    }

def create_post(user: dict, payload: PostCreateSchema) -> dict:
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    author_name = user.get("FullName") or "Developer"
    author_avatar = user.get("AvatarUrl", "")
    author_title = user.get("Title") or "Developer"

    item = {
        "PostID": post_id,
        "AuthorID": user.get("UserID"),
        "AuthorName": author_name,
        "AuthorAvatar": author_avatar,
        "AuthorTitle": author_title,
        "Content": payload.content,
        "Type": payload.type or "discussion",
        "Category": "GENERAL",
        "CreatedAt": created_at,
        "Tags": payload.tags or [],
        "Likes": 0,
        "LikedBy": [],
        "Reposts": 0,
        "RepostedBy": [],
        "Comments": []
    }
    
    if payload.code_snippet:
        item["CodeSnippet"] = payload.code_snippet.model_dump()
    if payload.achievement:
        item["Achievement"] = payload.achievement

    posts_table.put_item(Item=item)
    return format_post(item)

def get_feed_posts(limit: int = 50) -> list[dict]:
    items = []
    try:
        response = posts_table.query(
            IndexName='Feed-index',
            KeyConditionExpression=Key('Category').eq('GENERAL'),
            ScanIndexForward=False,
            Limit=limit
        )
        items = response.get('Items', [])
    except Exception:
        # Fallback scan if GSI query fails or table empty
        pass
    
    if not items:
        response = posts_table.scan(Limit=limit)
        items = response.get('Items', [])
        items.sort(key=lambda x: x.get('CreatedAt', ''), reverse=True)

    return [format_post(item) for item in items]

def get_post_by_id(post_id: str) -> dict | None:
    response = posts_table.get_item(Key={'PostID': post_id})
    item = response.get('Item')
    return format_post(item) if item else None

def add_comment_to_post(post_id: str, user: dict, content: str) -> dict | None:
    post = get_post_by_id(post_id)
    if not post:
        return None

    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat() + "Z"
    
    new_comment = {
        "comment_id": comment_id,
        "user_id": user.get("UserID"),
        "user_name": user.get("FullName") or "Developer",
        "user_avatar": user.get("AvatarUrl", ""),
        "content": content,
        "created_at": created_at
    }

    response = posts_table.update_item(
        Key={'PostID': post_id},
        UpdateExpression="SET Comments = list_append(if_not_exists(Comments, :empty_list), :new_cmt)",
        ExpressionAttributeValues={
            ':new_cmt': [new_comment],
            ':empty_list': []
        },
        ReturnValues="ALL_NEW"
    )
    
    updated_item = response.get('Attributes')
    return format_post(updated_item) if updated_item else None

def toggle_like_post(post_id: str, user_id: str) -> dict | None:
    response = posts_table.get_item(Key={'PostID': post_id})
    item = response.get('Item')
    if not item:
        return None

    liked_by = item.get('LikedBy', [])
    if user_id in liked_by:
        liked_by.remove(user_id)
    else:
        liked_by.append(user_id)

    likes_count = len(liked_by)

    response = posts_table.update_item(
        Key={'PostID': post_id},
        UpdateExpression="SET LikedBy = :liked_by, Likes = :likes_count",
        ExpressionAttributeValues={
            ':liked_by': liked_by,
            ':likes_count': likes_count
        },
        ReturnValues="ALL_NEW"
    )
    
    updated_item = response.get('Attributes')
    return format_post(updated_item) if updated_item else None

def update_post(post_id: str, new_content: str) -> dict | None:
    response = posts_table.update_item(
        Key={'PostID': post_id},
        UpdateExpression="SET Content = :content",
        ExpressionAttributeValues={
            ':content': new_content
        },
        ReturnValues="ALL_NEW"
    )
    updated_item = response.get('Attributes')
    return format_post(updated_item) if updated_item else None

def delete_post(post_id: str) -> bool:
    posts_table.delete_item(Key={'PostID': post_id})
    return True

def delete_comment_from_post(post_id: str, comment_id: str, requesting_user: dict) -> dict | None:
    response = posts_table.get_item(Key={'PostID': post_id})
    item = response.get('Item')
    if not item:
        return None

    comments = item.get('Comments', [])
    user_id = requesting_user.get('UserID')
    user_role = requesting_user.get('Role', 'user')
    post_author_id = item.get('AuthorID')

    target_comment = next((c for c in comments if c.get('comment_id') == comment_id), None)
    if not target_comment:
        return None

    comment_author_id = target_comment.get('user_id')

    # Permission check: comment author, post author, or admin
    if user_id != comment_author_id and user_id != post_author_id and user_role != 'admin':
        raise PermissionError("You do not have permission to delete this comment")

    updated_comments = [c for c in comments if c.get('comment_id') != comment_id]

    res = posts_table.update_item(
        Key={'PostID': post_id},
        UpdateExpression="SET Comments = :comments",
        ExpressionAttributeValues={
            ':comments': updated_comments
        },
        ReturnValues="ALL_NEW"
    )
    
    updated_item = res.get('Attributes')
    return format_post(updated_item) if updated_item else None

def toggle_repost_post(post_id: str, user_id: str) -> dict | None:
    response = posts_table.get_item(Key={'PostID': post_id})
    item = response.get('Item')
    if not item:
        return None

    reposted_by = item.get('RepostedBy', [])
    if user_id in reposted_by:
        reposted_by.remove(user_id)
    else:
        reposted_by.append(user_id)

    reposts_count = len(reposted_by)

    response = posts_table.update_item(
        Key={'PostID': post_id},
        UpdateExpression="SET RepostedBy = :reposted_by, Reposts = :reposts_count",
        ExpressionAttributeValues={
            ':reposted_by': reposted_by,
            ':reposts_count': reposts_count
        },
        ReturnValues="ALL_NEW"
    )
    
    updated_item = response.get('Attributes')
    return format_post(updated_item) if updated_item else None

def get_user_posts(target_user_id: str) -> list[dict]:
    response = posts_table.scan()
    items = response.get('Items', [])
    
    filtered_items = []
    for item in items:
        author_id = item.get('AuthorID', '')
        reposted_by = item.get('RepostedBy', [])
        if author_id == target_user_id or target_user_id in reposted_by:
            filtered_items.append(item)
            
    filtered_items.sort(key=lambda x: x.get('CreatedAt', ''), reverse=True)
    return [format_post(item) for item in filtered_items]


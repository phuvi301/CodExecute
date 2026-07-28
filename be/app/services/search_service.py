import logging
from typing import Optional, List, Dict, Any
from app.core.aws import dynamodb_resource
from app.core.config import settings
from app.services import problem_service, storage_service, follow_service

logger = logging.getLogger(__name__)

users_table = dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)

def format_user_for_search(user: dict, current_user_id: Optional[str] = None) -> dict:
    target_user_id = user.get("UserID")
    raw_avatar = user.get("AvatarUrl", "")
    
    is_self = bool(current_user_id and current_user_id == target_user_id)
    is_following = False
    if current_user_id and not is_self:
        is_following = follow_service.is_following(current_user_id, target_user_id)

    follow_counts = follow_service.get_follow_counts(target_user_id)

    return {
        "user_id": target_user_id,
        "email": user.get("Email", ""),
        "full_name": user.get("FullName", ""),
        "avatar_url": storage_service.get_public_avatar_url(raw_avatar),
        "title": user.get("Title") if user.get("Title") else "Unknown",

        "bio": user.get("Bio", ""),
        "role": user.get("Role", "user"),
        "is_self": is_self,
        "is_following": is_following,
        "followers_count": follow_counts.get("followers_count", 0),
        "following_count": follow_counts.get("following_count", 0),
    }

def search_problems(query: str) -> List[Dict[str, Any]]:
    """Tìm kiếm bài toán theo Tên bài toán (Title) hoặc Topic Category"""
    q = query.strip().lstrip('#').lower()
    if not q:
        return []

    all_problems = problem_service.get_all_problems()
    results = []
    
    for p in all_problems:
        title = str(p.get("Title", "")).lower()
        category = str(p.get("Category", "")).lower()
        category_compact = category.replace(" ", "").replace("&", "")
        
        if q in title or q in category or q in category_compact:
            results.append({
                "id": p.get("ProblemID", "1"),
                "title": p.get("Title", "Untitled"),
                "difficulty": p.get("Difficulty", "Easy"),
                "category": p.get("Category", "General"),
                "acceptance": f"{p.get('AcceptanceRate', 48.2)}%" if isinstance(p.get('AcceptanceRate'), (int, float)) else str(p.get('AcceptanceRate', '48.2%')),
                "description": p.get("Description", "")
            })
            
    return results

def search_users(query: str, current_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Tìm kiếm người dùng CHỈ theo tên người dùng (FullName)"""
    q = query.strip().lower()
    if not q:
        return []

    all_users = []
    try:
        response = users_table.scan()
        all_users = response.get("Items", [])
    except Exception as e:
        logger.warning(f"Lỗi scan Users table: {e}")

    results = []
    for user in all_users:
        full_name = str(user.get("FullName", "")).lower()

        if q in full_name:
            results.append(format_user_for_search(user, current_user_id))

    return results

def search_all(query: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
    return {
        "query": query,
        "problems": search_problems(query),
        "users": search_users(query, current_user_id)
    }

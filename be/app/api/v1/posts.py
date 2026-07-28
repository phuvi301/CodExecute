from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.post import PostCreateSchema, PostUpdateSchema, CommentCreateSchema
from app.services import auth_service, posts_service, notification_service
from app.core import security

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)

def get_current_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token_data = security.decode_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    
    user_id = token_data.get("sub")
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("", summary="Lấy danh sách các bài viết trên feed")
async def get_feed_posts(limit: int = 50):
    return posts_service.get_feed_posts(limit=limit)

@router.post("", summary="Đăng bài viết mới")
async def create_post(
    payload: PostCreateSchema,
    user: dict = Depends(get_current_user_from_token)
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Nội dung bài viết không được để trống")
    return posts_service.create_post(user, payload)

@router.patch("/{post_id}", summary="Chỉnh sửa nội dung bài viết")
async def update_post(
    post_id: str,
    payload: PostUpdateSchema,
    user: dict = Depends(get_current_user_from_token)
):
    existing_post = posts_service.get_post_by_id(post_id)
    if not existing_post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    
    if existing_post.get("author_id") != user.get("UserID"):
        raise HTTPException(status_code=403, detail="Bạn không có quyền chỉnh sửa bài viết này")
    
    if payload.content is not None:
        clean_content = payload.content.strip()
        if not clean_content:
            raise HTTPException(status_code=400, detail="Nội dung bài viết không được để trống")
        updated = posts_service.update_post(post_id, clean_content)
        return updated
    
    return existing_post

@router.delete("/{post_id}", summary="Xóa bài viết")
async def delete_post(
    post_id: str,
    user: dict = Depends(get_current_user_from_token)
):
    existing_post = posts_service.get_post_by_id(post_id)
    if not existing_post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    
    if existing_post.get("author_id") != user.get("UserID") and user.get("Role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bài viết này")
    
    posts_service.delete_post(post_id)
    return {"message": "Xóa bài viết thành công"}

@router.post("/{post_id}/comments", summary="Viết bình luận cho bài viết")
async def add_comment(
    post_id: str,
    payload: CommentCreateSchema,
    user: dict = Depends(get_current_user_from_token)
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Nội dung bình luận không được để trống")
    
    updated_post = posts_service.add_comment_to_post(post_id, user, payload.content.strip())
    if not updated_post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    author_id = updated_post.get("author_id")
    if author_id and author_id != user.get("UserID"):
        comment_snippet = payload.content.strip()
        if len(comment_snippet) > 40:
            comment_snippet = comment_snippet[:37] + "..."
        notification_service.create_notification(
            recipient_id=author_id,
            sender=user,
            notif_type="COMMENT",
            content=f'commented on your post: "{comment_snippet}"',
            post_id=post_id
        )

    return updated_post

@router.post("/{post_id}/like", summary="Thả tim hoặc bỏ thả tim bài viết")
async def toggle_like_post(
    post_id: str,
    user: dict = Depends(get_current_user_from_token)
):
    user_id = user.get("UserID")
    updated_post = posts_service.toggle_like_post(post_id, user_id)
    if not updated_post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    if user_id in updated_post.get("liked_by", []):
        author_id = updated_post.get("author_id")
        if author_id and author_id != user_id:
            notification_service.create_notification(
                recipient_id=author_id,
                sender=user,
                notif_type="LIKE",
                content="liked your post",
                post_id=post_id
            )

    return updated_post

@router.delete("/{post_id}/comments/{comment_id}", summary="Xóa bình luận bài viết")
async def delete_comment(
    post_id: str,
    comment_id: str,
    user: dict = Depends(get_current_user_from_token)
):
    try:
        updated_post = posts_service.delete_comment_from_post(post_id, comment_id, user)
        if not updated_post:
            raise HTTPException(status_code=404, detail="Bài viết hoặc bình luận không tồn tại")
        return updated_post
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

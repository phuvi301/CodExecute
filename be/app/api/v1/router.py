from fastapi import APIRouter
from app.api.v1 import auth, users, storage, problems, submissions, posts, notifications

api_router = APIRouter()

# Đóng gói theo tiền tố (Prefix) và Thẻ (Tags) để Swagger UI hiển thị đẹp mắt
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profile"])
api_router.include_router(storage.router, prefix="/storage", tags=["Storage & Media"])
api_router.include_router(problems.router, prefix="/problems", tags=["Problems"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["Submissions"])
api_router.include_router(posts.router, prefix="/posts", tags=["Posts & Feed"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
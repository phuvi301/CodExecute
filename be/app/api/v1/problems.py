from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.services import problem_service

router = APIRouter()

@router.get("", summary="Lấy danh sách tất cả các bài toán")
async def list_problems():
    """Lấy danh sách các bài toán công khai cho trang ProblemList"""
    problems = problem_service.get_all_problems()
    return problems

@router.get("/{problem_id}", summary="Lấy chi tiết một bài toán theo ID")
async def get_problem(problem_id: str):
    """Lấy nội dung đề bài, ví dụ mẫu và ràng buộc cho trang ProblemEditor"""
    problem = problem_service.get_problem_details(problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài toán"
        )
    return problem
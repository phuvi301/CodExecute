from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.services import problem_service
from app.schemas.problem import (
    ProblemResponse,
    ProblemCreate,
    ProblemUpdate,
    ProblemAdminDetailResponse
)
from app.core.dependencies import require_admin

router = APIRouter()

@router.get("", summary="Get list of all problems")
async def list_problems():
    """Retrieve public problem list for ProblemListPage"""
    problems = problem_service.get_all_problems()
    return problems

@router.post("", summary="Create a new problem (Admin Only)", status_code=status.HTTP_201_CREATED)
async def create_problem(
    payload: ProblemCreate,
    current_admin: dict = Depends(require_admin)
):
    """Admin creates a new problem with testcases"""
    try:
        problem_dict = payload.dict(exclude={"testcases"})
        testcases_list = [tc.dict() for tc in payload.testcases] if payload.testcases else []
        new_prob = problem_service.create_problem(problem_dict, testcases_list)
        return new_prob
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create problem: {str(e)}")

@router.get("/{problem_id}/admin-detail", response_model=ProblemAdminDetailResponse, summary="Get full problem details with testcases (Admin Only)")
async def get_admin_problem_detail(
    problem_id: str,
    current_admin: dict = Depends(require_admin)
):
    """Retrieve full problem details including hidden testcases for Admin Edit"""
    detail = problem_service.get_admin_problem_detail(problem_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Problem not found.")
    return detail

@router.get("/{problem_id}", summary="Get problem detail by ID")
async def get_problem(problem_id: str):
    """Retrieve problem description, sample examples and constraints for ProblemEditorPage"""
    problem = problem_service.get_problem_details(problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found."
        )
    return problem

@router.put("/{problem_id}", summary="Update a problem (Admin Only)")
async def update_problem(
    problem_id: str,
    payload: ProblemUpdate,
    current_admin: dict = Depends(require_admin)
):
    """Admin updates problem details and testcases"""
    update_data = payload.dict(exclude_unset=True, exclude={"testcases"})
    testcases_data = [tc.dict() for tc in payload.testcases] if payload.testcases is not None else None
    
    updated_prob = problem_service.update_problem(problem_id, update_data, testcases_data)
    return updated_prob

@router.delete("/{problem_id}", summary="Delete a problem (Admin Only)")
async def delete_problem(
    problem_id: str,
    current_admin: dict = Depends(require_admin)
):
    """Admin deletes a problem"""
    problem_service.delete_problem(problem_id)
    return {"message": f"Successfully deleted problem '{problem_id}'."}
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.submission import SubmissionCreate, SubmissionResponse, SubmissionStatus
from app.services import submissions_service, sqs_service, problem_service
from app.core import security
from app.core.config import settings
from app.executor import runner
from lambda_worker import process_single_submission

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)


def get_optional_user_id(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> Optional[str]:
    """Lấy user_id nếu có token, không bắt buộc nếu chưa đăng nhập"""
    if credentials and credentials.credentials:
        token_data = security.decode_token(credentials.credentials)
        if token_data:
            return token_data.get("sub")
    return "guest-user"


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    """Lấy user_id từ Authorization Bearer Token (bắt buộc cho Submit)"""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập để nộp bài"
        )
    token_data = security.decode_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn"
        )
    return token_data.get("sub")


@router.post("/run", summary="Chạy thử code trên các testcase mẫu (Nút RUN - Không lưu DB)")
async def run_sample_code(
    payload: SubmissionCreate,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Nút RUN CODE của Frontend:
    Chạy 3 - 5 testcases mẫu của bài toán trong /tmp. KHÔNG lưu kết quả vào Database. KHÔNG đẩy vào SQS.
    """
    language_str = payload.language.value if hasattr(payload.language, "value") else str(payload.language)
    
    # 1. Lấy ra các testcase mẫu (is_sample = True)
    sample_testcases = problem_service.get_sample_testcases_for_run(payload.problem_id)
    problem = problem_service.get_problem_details(payload.problem_id)

    time_limit = float(problem.get("TimeLimit", 2.0)) if problem else 2.0
    memory_limit = int(problem.get("MemoryLimit", 256)) if problem else 256

    run_sub_id = f"run_{uuid.uuid4().hex[:8]}"

    code_to_run = payload.code
    if problem:
        driver_dict = problem.get("DriverCode") or problem.get("driver_code")
        drv = runner.get_driver_code_for_lang(driver_dict, language_str)
        if drv and drv not in code_to_run:
            code_to_run = code_to_run + "\n\n" + drv

    # 2. Thực thi trực tiếp qua executor runner
    result = runner.execute_submission(
        submission_id=run_sub_id,
        language=language_str,
        code=code_to_run,
        testcases=sample_testcases,
        time_limit=time_limit,
        memory_limit=memory_limit
    )

    # 3. Trả về kết quả thực thi trực tiếp cho Frontend
    return {
        "status": result["status"],
        "execution_time": result["execution_time"],
        "memory_used": result["memory_used"],
        "passed_testcases": result["passed_testcases"],
        "total_testcases": result["total_testcases"],
        "error_message": result.get("error_message", ""),
        "testcases": sample_testcases,
        "is_run_only": True
    }


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED, summary="Nộp bài lập trình (Nút SUBMIT - Lưu DB & SQS)")
async def create_submission(
    payload: SubmissionCreate,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    """
    Flow NỘP BÀI (SUBMIT) của User:
    1. Tạo pending request & lưu status 'Pending' + nội dung code trực tiếp vào database.
    2. Đẩy payload bài nộp vào AWS SQS Queue.
    3. Trả về thông tin pending submission ngay lập tức cho Frontend.
    """
    submission_id = str(uuid.uuid4())
    language_str = payload.language.value if hasattr(payload.language, "value") else str(payload.language)

    code_to_submit = payload.code
    problem = problem_service.get_problem_details(payload.problem_id)
    if problem:
        driver_dict = problem.get("DriverCode") or problem.get("driver_code")
        drv = runner.get_driver_code_for_lang(driver_dict, language_str)
        if drv and drv not in code_to_submit:
            code_to_submit = code_to_submit + "\n\n" + drv

    # 1. Tạo pending submission trong DynamoDB (code content lưu trực tiếp vào DB)
    item = submissions_service.create_pending_submission(
        submission_id=submission_id,
        user_id=user_id,
        problem_id=payload.problem_id,
        language=language_str,
        code=payload.code
    )

    # 2. Đẩy payload bài nộp vào SQS Queue (chỉ đẩy SQS nếu cấu hình EXECUTION_MODE == "ecs" hoặc ENVIRONMENT == "production")
    message_id = None
    if getattr(settings, "EXECUTION_MODE", "tmp").lower() == "ecs" or getattr(settings, "ENVIRONMENT", "development").lower() == "production":
        message_id = sqs_service.push_submission_to_queue(
            submission_id=submission_id,
            user_id=user_id,
            problem_id=payload.problem_id,
            language=language_str,
            code=code_to_submit
        )

    # Nếu đang ở local (EXECUTION_MODE == "tmp"), tự động dùng local BackgroundTasks để chấm bài trên máy
    if not message_id:
        background_tasks.add_task(
            process_single_submission,
            submission_id=submission_id,
            problem_id=payload.problem_id,
            language=language_str,
            code=code_to_submit
        )

    # 3. Trả về thông tin pending submission cho Frontend
    return SubmissionResponse(
        submission_id=item["SubmissionID"],
        user_id=item["UserID"],
        problem_id=item["ProblemID"],
        language=item["Language"],
        code=item["Code"],
        status=SubmissionStatus.PENDING,
        execution_time=0.0,
        memory_used=0.0,
        passed_testcases=0,
        total_testcases=0,
        error_message="",
        submitted_at=item["SubmittedAt"]
    )


@router.get("/me", response_model=List[SubmissionResponse], summary="Lấy danh sách các bài nộp của user đang đăng nhập")
async def get_my_submissions(
    problem_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Lấy danh sách lịch sử nộp bài của người dùng đang đăng nhập"""
    items = submissions_service.get_user_submissions(user_id=user_id, problem_id=problem_id)
    responses = []
    for item in items:
        responses.append(SubmissionResponse(
            submission_id=item.get("SubmissionID"),
            user_id=item.get("UserID"),
            problem_id=item.get("ProblemID"),
            language=item.get("Language"),
            code=item.get("Code", ""),
            status=item.get("Status", SubmissionStatus.PENDING),
            execution_time=item.get("ExecutionTime", 0.0),
            memory_used=item.get("MemoryUsed", 0.0),
            passed_testcases=item.get("PassedTestCases", 0),
            total_testcases=item.get("TotalTestCases", 0),
            error_message=item.get("ErrorMessage", ""),
            submitted_at=item.get("SubmittedAt", "")
        ))
    return responses


@router.get("/{submission_id}", response_model=SubmissionResponse, summary="Lấy chi tiết trạng thái bài nộp")
async def get_submission(
    submission_id: str,
    user_id: str = Depends(get_optional_user_id)
):
    """Lấy trạng thái và kết quả chi tiết của bài nộp theo submission_id"""
    item = submissions_service.get_submission_by_id(submission_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài nộp"
        )
    return SubmissionResponse(
        submission_id=item.get("SubmissionID"),
        user_id=item.get("UserID"),
        problem_id=item.get("ProblemID"),
        language=item.get("Language"),
        code=item.get("Code", ""),
        status=item.get("Status", SubmissionStatus.PENDING),
        execution_time=item.get("ExecutionTime", 0.0),
        memory_used=item.get("MemoryUsed", 0.0),
        passed_testcases=item.get("PassedTestCases", 0),
        total_testcases=item.get("TotalTestCases", 0),
        error_message=item.get("ErrorMessage", ""),
        submitted_at=item.get("SubmittedAt", "")
    )
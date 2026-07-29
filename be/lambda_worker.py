import json
import logging
from app.services import submissions_service
from app.executor import runner

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def process_single_submission(submission_id: str, problem_id: str, language: str, code: str) -> dict:
    """
    Xử lý chấm bài toán:
    1. Lấy thông tin bài toán & testcases (input/output tải từ S3)
    2. Chuyển giao việc thực thi code sang AWS ECS Task container (hoặc runner local)
    3. Nhận kết quả chấm bài từ runner
    4. Lưu kết quả vào DynamoDB database
    """
    logger.info(f"[Worker] Starting execution for submission {submission_id} (Problem: {problem_id}, Lang: {language})")

    # 1. Lấy giới hạn thời gian/bộ nhớ và danh sách testcases từ S3
    problem = submissions_service.get_problem_by_id(problem_id)
    time_limit = float(problem.get("TimeLimit", 2.0)) if problem else 2.0
    memory_limit = int(problem.get("MemoryLimit", 256)) if problem else 256

    testcases = submissions_service.get_testcases_with_content(problem_id)
    logger.info(f"Loaded {len(testcases)} testcases for problem {problem_id}")

    code_to_run = code
    if problem:
        driver_dict = problem.get("DriverCode") or problem.get("driver_code")
        drv = runner.get_driver_code_for_lang(driver_dict, language)
        if drv and drv not in code_to_run:
            code_to_run = code_to_run + "\n\n" + drv

    # 2 & 3. Thực thi code qua ECS Task / Runner
    result = runner.execute_submission(
        submission_id=submission_id,
        language=language,
        code=code_to_run,
        testcases=testcases,
        time_limit=time_limit,
        memory_limit=memory_limit
    )

    logger.info(f"[Worker] Execution finished for submission {submission_id}. Result: {result['status']}")

    # 4. Lưu kết quả thực thi vào database (DynamoDB)
    updated_item = submissions_service.update_submission_result(
        submission_id=submission_id,
        status=result["status"],
        execution_time=result["execution_time"],
        memory_used=result["memory_used"],
        passed_testcases=result["passed_testcases"],
        total_testcases=result["total_testcases"],
        error_message=result.get("error_message", "")
    )

    return updated_item


def handler(event, context):
    """
    AWS Lambda Handler được trigger tự động bởi Amazon SQS Event
    """
    logger.info(f"📥 Lambda Worker invoked with event: {json.dumps(event)}")
    processed_submissions = []

    records = event.get("Records", [])
    for record in records:
        try:
            body_str = record.get("body", "{}")
            body = json.loads(body_str)

            submission_id = body.get("submission_id")
            problem_id = body.get("problem_id")
            language = body.get("language")
            code = body.get("code")

            if submission_id and problem_id and code:
                res = process_single_submission(
                    submission_id=submission_id,
                    problem_id=problem_id,
                    language=language,
                    code=code
                )
                processed_submissions.append(res)
            else:
                logger.warning(f"Bản ghi SQS thiếu dữ liệu bắt buộc: {body}")

        except Exception as e:
            logger.error(f"Lỗi khi xử lý bản ghi SQS: {e}", exc_info=True)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Xử lý hàng đợi bài chấm thành công",
            "processed_count": len(processed_submissions)
        })
    }


if __name__ == "__main__":
    # Test chạy trực tiếp worker từ command line
    print("Lambda Worker script initialized.")

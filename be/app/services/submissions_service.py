import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError
from app.core.aws import dynamodb_resource, s3_client
from app.core.config import settings

logger = logging.getLogger(__name__)

submissions_table = dynamodb_resource.Table(settings.DYNAMODB_SUBMISSIONS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)
problems_table = dynamodb_resource.Table(settings.DYNAMODB_PROBLEMS_TABLE)


def convert_decimals(obj: Any) -> Any:
    """Helper chuyển đổi Decimal của boto3 DynamoDB thành float/int chuẩn cho JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if float(obj) % 1 != 0 else int(obj)
    return obj


def create_pending_submission(
    submission_id: str,
    user_id: str,
    problem_id: str,
    language: str,
    code: str
) -> Dict[str, Any]:
    """
    Tạo pending request và lưu status 'Pending' cùng nội dung code trực tiếp vào DynamoDB.
    Chú ý: Boto3 DynamoDB bắt buộc dùng Decimal thay cho float.
    """
    submitted_at = datetime.now(timezone.utc).isoformat()
    item = {
        "SubmissionID": submission_id,
        "UserID": user_id,
        "ProblemID": problem_id,
        "Language": language,
        "Code": code,  # Lưu nội dung code trực tiếp vào database
        "Status": "Pending",
        "ExecutionTime": Decimal("0.0"),  # Dùng Decimal thay cho float 0.0
        "MemoryUsed": Decimal("0.0"),     # Dùng Decimal thay cho float 0.0
        "PassedTestCases": 0,
        "TotalTestCases": 0,
        "ErrorMessage": "",
        "SubmittedAt": submitted_at
    }

    try:
        submissions_table.put_item(Item=item)
        logger.info(f"Created pending submission {submission_id} for user {user_id}")
    except Exception as e:
        logger.error(f"Lỗi khi lưu submission vào DynamoDB: {e}")
        raise e

    return convert_decimals(item)


def get_submission_by_id(submission_id: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin chi tiết một submission theo ID"""
    try:
        response = submissions_table.get_item(Key={"SubmissionID": submission_id})
        item = response.get("Item")
        return convert_decimals(item) if item else None
    except Exception as e:
        logger.error(f"Lỗi khi lấy submission {submission_id}: {e}")
        return None


def get_user_submissions(user_id: str, problem_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lấy danh sách các submission của một user (lọc theo problem_id nếu có)"""
    try:
        if problem_id:
            response = submissions_table.scan(
                FilterExpression="UserID = :uid AND ProblemID = :pid",
                ExpressionAttributeValues={":uid": user_id, ":pid": problem_id}
            )
        else:
            response = submissions_table.scan(
                FilterExpression="UserID = :uid",
                ExpressionAttributeValues={":uid": user_id}
            )
        items = response.get("Items", [])
        items.sort(key=lambda x: x.get("SubmittedAt", ""), reverse=True)
        return convert_decimals(items)
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách submissions của user {user_id}: {e}")
        return []


def update_submission_result(
    submission_id: str,
    status: str,
    execution_time: float,
    memory_used: float,
    passed_testcases: int,
    total_testcases: int,
    error_message: str = ""
) -> Dict[str, Any]:
    """Cập nhật kết quả chấm bài sau khi Lambda Worker thực thi xong vào DynamoDB"""
    try:
        # Chuyển đổi float thành Decimal chuẩn của boto3 DynamoDB
        dec_execution_time = Decimal(str(round(execution_time, 3)))
        dec_memory_used = Decimal(str(round(memory_used, 2)))

        response = submissions_table.update_item(
            Key={"SubmissionID": submission_id},
            UpdateExpression="""
                SET #st = :status, 
                    ExecutionTime = :ext, 
                    MemoryUsed = :mem, 
                    PassedTestCases = :ptc, 
                    TotalTestCases = :ttc, 
                    ErrorMessage = :err,
                    CompletedAt = :cat
            """,
            ExpressionAttributeNames={
                "#st": "Status"
            },
            ExpressionAttributeValues={
                ":status": status,
                ":ext": dec_execution_time,
                ":mem": dec_memory_used,
                ":ptc": int(passed_testcases),
                ":ttc": int(total_testcases),
                ":err": error_message,
                ":cat": datetime.now(timezone.utc).isoformat()
            },
            ReturnValues="ALL_NEW"
        )
        logger.info(f"Updated submission {submission_id} result: {status}")
        return convert_decimals(response.get("Attributes", {}))
    except Exception as e:
        logger.error(f"Lỗi cập nhật kết quả submission {submission_id}: {e}")
        return {}


def get_problem_by_id(problem_id: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin giới hạn thời gian / bộ nhớ của bài toán từ DynamoDB Problems table"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        return convert_decimals(item) if item else None
    except Exception as e:
        logger.warning(f"Không thể lấy thông tin problem {problem_id}: {e}")
        return None


def fetch_s3_text_file(s3_key: str) -> str:
    """Tải nội dung text từ file S3 (input/output của testcase)"""
    if not s3_key:
        return ""
    try:
        obj = s3_client.get_object(Bucket=settings.S3_TESTCASE_BUCKET, Key=s3_key)
        content = obj["Body"].read().decode("utf-8")
        return content
    except Exception as e:
        logger.warning(f"Lỗi khi tải file testcase từ S3 key '{s3_key}': {e}")
        return ""


def get_testcases_with_content(problem_id: str) -> List[Dict[str, str]]:
    """
    Lấy danh sách vị trí testcase của bài toán từ DynamoDB TestCases table,
    sau đó các Lambda Worker tải nội dung input và output tương ứng từ S3 bucket để chạy chấm bài.
    """
    testcases = []
    items = []
    
    # 1. Lấy vị trí các testcase từ DynamoDB database
    try:
        response = testcases_table.scan(
            FilterExpression="ProblemID = :pid",
            ExpressionAttributeValues={":pid": problem_id}
        )
        items = response.get("Items", [])
    except Exception as e:
        logger.warning(f"Lỗi quét bảng TestCases cho problem {problem_id}: {e}")
        items = []

    def tc_sort_key(item):
        tc_id = str(item.get("TestCaseID", "0"))
        return int(tc_id) if tc_id.isdigit() else tc_id

    if items:
        items.sort(key=tc_sort_key)
        for item in items:
            s3_in = item.get("S3InputKey") or item.get("s3_input_key") or f"{problem_id}/input/{item.get('TestCaseID')}.txt"
            s3_out = item.get("S3OutputKey") or item.get("s3_output_key") or f"{problem_id}/output/{item.get('TestCaseID')}.txt"

            inp = fetch_s3_text_file(s3_in)
            if not inp:
                inp = item.get("InputPreview") or item.get("Input") or item.get("input") or ""

            out = fetch_s3_text_file(s3_out)
            if not out:
                out = item.get("OutputPreview") or item.get("Output") or item.get("output") or ""

            testcases.append({
                "testcase_id": str(item.get("TestCaseID", "tc")),
                "input": inp,
                "output": out
            })
    else:
        # Fallback nếu DB chưa có record: thử load trực tiếp 60 testcases từ S3 theo pattern /{problem_id}/input/1.txt ...
        logger.info(f"Không tìm thấy record testcases trong DB cho {problem_id}, thử nạp trực tiếp từ S3...")
        for i in range(1, 61):
            s3_in = f"{problem_id}/input/{i}.txt"
            s3_out = f"{problem_id}/output/{i}.txt"
            
            inp = fetch_s3_text_file(s3_in)
            out = fetch_s3_text_file(s3_out)
            
            if inp or out:
                testcases.append({
                    "testcase_id": str(i),
                    "input": inp,
                    "output": out
                })
            else:
                if i > 5:
                    break

    return testcases

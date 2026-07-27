import logging
from typing import Optional, List, Dict, Any
from app.core.aws import dynamodb_resource
from app.core.config import settings

logger = logging.getLogger(__name__)

problems_table = dynamodb_resource.Table(settings.DYNAMODB_PROBLEMS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)

# Danh sách bài toán mẫu được khởi tạo mặc định nếu DB chưa có
SAMPLE_PROBLEMS: List[Dict[str, Any]] = [
    {
        "ProblemID": "two-sum",
        "Title": "Two Sum",
        "Difficulty": "Easy",
        "Category": "Array & Hash Table",
        "AcceptanceRate": 48.2,
        "TimeLimit": 2.0,
        "MemoryLimit": 256,
        "Description": "Cho một mảng số nguyên `nums` và một số nguyên `target`. Hãy tìm chỉ số của 2 số trong mảng sao cho tổng của chúng bằng `target`.\n\nInput format:\n- Dòng 1: Danh sách các số nguyên `nums` cách nhau bởi dấu cách.\n- Dòng 2: Số nguyên `target`.",
        "Constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
        "Examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "Do nums[0] + nums[1] == 9, trả về 0 1."},
            {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] == 6, trả về 1 2."},
            {"input": "3 3\n6", "output": "0 1", "explanation": "nums[0] + nums[1] == 6, trả về 0 1."}
        ]
    },
    {
        "ProblemID": "add-two-numbers",
        "Title": "Add Two Numbers",
        "Difficulty": "Medium",
        "Category": "Linked List",
        "AcceptanceRate": 41.5,
        "TimeLimit": 2.0,
        "MemoryLimit": 256,
        "Description": "Cho hai danh sách liên kết không rỗng biểu diễn hai số nguyên không âm. Các chữ số được lưu theo thứ tự ngược lại.",
        "Constraints": "1 <= node.val <= 9",
        "Examples": [
            {"input": "2 4 3\n5 6 4", "output": "7 0 8", "explanation": "342 + 465 = 807."}
        ]
    }
]

# Bộ testcase mẫu cho hai bài toán (bao gồm sample testcase cho Run và full testcases cho Submit)
SAMPLE_TESTCASES: Dict[str, List[Dict[str, Any]]] = {
    "two-sum": [
        # 3 Testcases mẫu (Hiển thị cho nút RUN - không lưu DB)
        {"testcase_id": "tc1", "is_sample": True, "input": "2 7 11 15\n9", "output": "0 1"},
        {"testcase_id": "tc2", "is_sample": True, "input": "3 2 4\n6", "output": "1 2"},
        {"testcase_id": "tc3", "is_sample": True, "input": "3 3\n6", "output": "0 1"},
        # 2 Testcases ẩn (Bổ sung cho nút SUBMIT - nộp bài lưu DB)
        {"testcase_id": "tc4", "is_sample": False, "input": "1 5 9 12\n14", "output": "1 2"},
        {"testcase_id": "tc5", "is_sample": False, "input": "10 -2 5 8\n3", "output": "1 2"}
    ],
    "1": [
        {"testcase_id": "tc1", "is_sample": True, "input": "2 7 11 15\n9", "output": "0 1"},
        {"testcase_id": "tc2", "is_sample": True, "input": "3 2 4\n6", "output": "1 2"},
        {"testcase_id": "tc3", "is_sample": True, "input": "3 3\n6", "output": "0 1"},
        {"testcase_id": "tc4", "is_sample": False, "input": "1 5 9 12\n14", "output": "1 2"},
        {"testcase_id": "tc5", "is_sample": False, "input": "10 -2 5 8\n3", "output": "1 2"}
    ]
}


def get_all_problems() -> List[Dict[str, Any]]:
    """Lấy danh sách các bài toán từ DynamoDB hoặc trả về danh sách mẫu"""
    try:
        response = problems_table.scan()
        items = response.get("Items", [])
        if items:
            return items
    except Exception as e:
        logger.warning(f"Lỗi scan DynamoDB Problems: {e}")
    return SAMPLE_PROBLEMS


def get_problem_details(problem_id: str) -> Dict[str, Any]:
    """Lấy chi tiết một bài toán theo ID"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        if item:
            return item
    except Exception as e:
        logger.warning(f"Không thể lấy problem {problem_id} từ DynamoDB: {e}")

    # Fallback bài toán mẫu
    for p in SAMPLE_PROBLEMS:
        if p["ProblemID"] == problem_id or problem_id in ["1", "two-sum"]:
            return p

    return SAMPLE_PROBLEMS[0]


def get_sample_testcases_for_run(problem_id: str) -> List[Dict[str, str]]:
    """
    Lấy ra từ 3 đến 5 testcases mẫu (is_sample = True) cho chức năng RUN CODE.
    Không lưu kết quả vào Database.
    """
    all_tc = get_all_testcases_for_submit(problem_id)
    sample_tc = [tc for tc in all_tc if tc.get("is_sample", True)]
    return sample_tc if sample_tc else all_tc[:3]


def get_all_testcases_for_submit(problem_id: str) -> List[Dict[str, Any]]:
    """
    Lấy đầy đủ bộ testcases (gồm cả testcases mẫu và testcases ẩn) cho chức năng SUBMIT CODE.
    """
    # 1. Thử lấy từ DynamoDB TestCases table
    try:
        response = testcases_table.scan(
            FilterExpression="ProblemID = :pid",
            ExpressionAttributeValues={":pid": problem_id}
        )
        items = response.get("Items", [])
        if items:
            tc_list = []
            for item in items:
                tc_list.append({
                    "testcase_id": item.get("TestCaseID", "tc"),
                    "is_sample": item.get("IsSample", True),
                    "input": item.get("InputPreview") or item.get("Input") or "",
                    "output": item.get("OutputPreview") or item.get("Output") or ""
                })
            return tc_list
    except Exception as e:
        logger.warning(f"Lỗi truy vấn TestCases cho {problem_id}: {e}")

    # 2. Fallback bộ testcases mẫu mặc định
    if problem_id in SAMPLE_TESTCASES:
        return SAMPLE_TESTCASES[problem_id]
    
    return SAMPLE_TESTCASES["two-sum"]

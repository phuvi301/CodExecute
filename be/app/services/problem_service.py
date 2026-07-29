import logging
import uuid
from datetime import datetime
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
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(N)",
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
        "TimeComplexity": "O(max(N, M))",
        "SpaceComplexity": "O(max(N, M))",
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
        {"testcase_id": "tc1", "is_sample": True, "input": "2 7 11 15\n9", "output": "0 1"},
        {"testcase_id": "tc2", "is_sample": True, "input": "3 2 4\n6", "output": "1 2"},
        {"testcase_id": "tc3", "is_sample": True, "input": "3 3\n6", "output": "0 1"},
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
    """Lấy danh sách các bài toán thực tế từ DynamoDB"""
    try:
        response = problems_table.scan()
        return response.get("Items", [])
    except Exception as e:
        logger.warning(f"Lỗi scan DynamoDB Problems: {e}")
        return []


def get_problem_details(problem_id: str) -> Optional[Dict[str, Any]]:
    """Lấy chi tiết một bài toán theo ID từ DynamoDB"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        if item:
            return item
    except Exception as e:
        logger.warning(f"Không thể lấy problem {problem_id} từ DynamoDB: {e}")

    return None


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

    if problem_id in SAMPLE_TESTCASES:
        return SAMPLE_TESTCASES[problem_id]
    
    return SAMPLE_TESTCASES["two-sum"]


# --- ADMIN SERVICE FUNCTIONS FOR PROBLEMS & TESTCASES ---

def get_problem_testcases_admin(problem_id: str) -> List[Dict[str, Any]]:
    """Lấy tất cả testcases của 1 bài toán cho màn hình Admin"""
    return get_all_testcases_for_submit(problem_id)


def save_problem_testcases(problem_id: str, testcases: List[Dict[str, Any]]) -> None:
    """Lưu/Cập nhật bộ testcases của 1 bài toán vào DynamoDB TestCases table"""
    try:
        # Xóa các testcases cũ
        existing = testcases_table.scan(
            FilterExpression="ProblemID = :pid",
            ExpressionAttributeValues={":pid": problem_id}
        ).get("Items", [])
        
        for old_tc in existing:
            testcases_table.delete_item(Key={
                "ProblemID": problem_id,
                "TestCaseID": old_tc["TestCaseID"]
            })
    except Exception as e:
        logger.warning(f"Lỗi khi xóa testcases cũ của {problem_id}: {e}")

    # Chèn các testcases mới
    for idx, tc in enumerate(testcases, start=1):
        tc_id = tc.get("testcase_id") or f"tc_{idx}_{uuid.uuid4().hex[:6]}"
        item = {
            "ProblemID": problem_id,
            "TestCaseID": tc_id,
            "IsSample": tc.get("is_sample", True),
            "Input": tc.get("input", ""),
            "Output": tc.get("output", ""),
            "InputPreview": tc.get("input", ""),
            "OutputPreview": tc.get("output", "")
        }
        try:
            testcases_table.put_item(Item=item)
        except Exception as e:
            logger.error(f"Lỗi khi lưu testcase {tc_id} cho {problem_id}: {e}")


def create_problem(problem_data: Dict[str, Any], testcases: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Tạo mới một bài toán trong DynamoDB"""
    problem_id = problem_data.get("problem_id") or f"prob_{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    item = {
        "ProblemID": problem_id,
        "Title": problem_data.get("title", ""),
        "Difficulty": problem_data.get("difficulty", "Easy"),
        "Category": problem_data.get("category", "General"),
        "TimeLimit": float(problem_data.get("time_limit", 2.0)),
        "MemoryLimit": int(problem_data.get("memory_limit", 256)),
        "TimeComplexity": problem_data.get("time_complexity", ""),
        "SpaceComplexity": problem_data.get("space_complexity", ""),
        "Description": problem_data.get("description", ""),
        "Constraints": problem_data.get("constraints", ""),
        "AcceptanceRate": 0.0,
        "CreatedAt": now_str,
    }

    try:
        problems_table.put_item(Item=item)
    except Exception as e:
        logger.error(f"Lỗi put_item DynamoDB Problems: {e}")
        raise RuntimeError(f"Không thể lưu bài toán vào Database: {e}")

    if testcases:
        save_problem_testcases(problem_id, testcases)

    return get_admin_problem_detail(problem_id)


def update_problem(problem_id: str, update_fields: Dict[str, Any], testcases: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Cập nhật bài toán trong DynamoDB"""
    update_expr = []
    expr_attr_values = {}
    expr_attr_names = {}

    field_mappings = {
        "title": "Title",
        "difficulty": "Difficulty",
        "category": "Category",
        "time_limit": "TimeLimit",
        "memory_limit": "MemoryLimit",
        "time_complexity": "TimeComplexity",
        "space_complexity": "SpaceComplexity",
        "description": "Description",
        "constraints": "Constraints",
    }

    for key, attr_name in field_mappings.items():
        if key in update_fields and update_fields[key] is not None:
            val = update_fields[key]
            if key == "time_limit":
                val = float(val)
            elif key == "memory_limit":
                val = int(val)
            
            placeholder_name = f"#{attr_name}"
            placeholder_val = f":{attr_name}"
            update_expr.append(f"{placeholder_name} = {placeholder_val}")
            expr_attr_names[placeholder_name] = attr_name
            expr_attr_values[placeholder_val] = val

    if update_expr:
        try:
            problems_table.update_item(
                Key={"ProblemID": problem_id},
                UpdateExpression="SET " + ", ".join(update_expr),
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values
            )
        except Exception as e:
            logger.error(f"Lỗi update_item DynamoDB Problems cho {problem_id}: {e}")

    if testcases is not None:
        save_problem_testcases(problem_id, testcases)

    return get_admin_problem_detail(problem_id)


def delete_problem(problem_id: str) -> None:
    """Xóa bài toán và bộ testcase khỏi DynamoDB"""
    try:
        problems_table.delete_item(Key={"ProblemID": problem_id})
    except Exception as e:
        logger.error(f"Lỗi delete_item DynamoDB Problems cho {problem_id}: {e}")

    try:
        tcs = testcases_table.scan(
            FilterExpression="ProblemID = :pid",
            ExpressionAttributeValues={":pid": problem_id}
        ).get("Items", [])
        for tc in tcs:
            testcases_table.delete_item(Key={"ProblemID": problem_id, "TestCaseID": tc["TestCaseID"]})
    except Exception as e:
        logger.warning(f"Lỗi khi dọn dẹp testcases của {problem_id}: {e}")


def get_admin_problem_detail(problem_id: str) -> Dict[str, Any]:
    """Lấy chi tiết bài toán + tất cả testcases phục vụ màn hình Admin Edit"""
    prob = get_problem_details(problem_id)
    tcs = get_problem_testcases_admin(problem_id)

    formatted_tcs = []
    for tc in tcs:
        formatted_tcs.append({
            "testcase_id": tc.get("testcase_id") or tc.get("TestCaseID", "tc"),
            "is_sample": tc.get("is_sample", tc.get("IsSample", True)),
            "input": tc.get("input", tc.get("InputPreview", "")),
            "output": tc.get("output", tc.get("OutputPreview", "")),
            "problem_id": problem_id
        })

    return {
        "problem_id": prob.get("ProblemID", problem_id),
        "title": prob.get("Title", ""),
        "difficulty": prob.get("Difficulty", "Easy"),
        "category": prob.get("Category", ""),
        "time_limit": float(prob.get("TimeLimit", 2.0)),
        "memory_limit": int(prob.get("MemoryLimit", 256)),
        "time_complexity": prob.get("TimeComplexity", ""),
        "space_complexity": prob.get("SpaceComplexity", ""),
        "description": prob.get("Description", ""),
        "constraints": prob.get("Constraints", ""),
        "acceptance_rate": float(prob.get("AcceptanceRate", 0.0)),
        "created_at": prob.get("CreatedAt", ""),
        "testcases": formatted_tcs
    }

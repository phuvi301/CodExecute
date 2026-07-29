import logging
import uuid
import re
import unicodedata
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from app.core.aws import dynamodb_resource
from app.core.config import settings

logger = logging.getLogger(__name__)

problems_table = dynamodb_resource.Table(settings.DYNAMODB_PROBLEMS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)
submissions_table = dynamodb_resource.Table(settings.DYNAMODB_SUBMISSIONS_TABLE)


def slugify(text: str) -> str:
    """Helper converting title or custom ID to URL slug (e.g., 'Two Sum' -> 'two-sum')"""
    if not text:
        return ""
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    normalized = normalized.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', normalized)
    return slug.strip('-')


def convert_decimals(obj: Any) -> Any:
    """Helper converting boto3 DynamoDB Decimal to standard float/int for JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if float(obj) % 1 != 0 else int(obj)
    return obj


def get_all_problems() -> List[Dict[str, Any]]:
    """Retrieve list of problems from DynamoDB with real-time acceptance rate & submission stats"""
    try:
        response = problems_table.scan()
        items = response.get("Items", [])
        items = convert_decimals(items)

        # Calculate actual acceptance rate and total submissions for each problem from Submissions table
        sub_stats = {}
        try:
            sub_res = submissions_table.scan(
                ProjectionExpression="ProblemID, #st",
                ExpressionAttributeNames={"#st": "Status"}
            )
            for sub in sub_res.get("Items", []):
                pid = sub.get("ProblemID")
                if pid:
                    if pid not in sub_stats:
                        sub_stats[pid] = {"total": 0, "accepted": 0}
                    sub_stats[pid]["total"] += 1
                    if sub.get("Status") == "Accepted":
                        sub_stats[pid]["accepted"] += 1
        except Exception as e:
            logger.warning(f"Error scanning submissions table for get_all_problems: {e}")

        for item in items:
            pid = item.get("ProblemID")
            if pid in sub_stats and sub_stats[pid]["total"] > 0:
                tot = sub_stats[pid]["total"]
                acc = sub_stats[pid]["accepted"]
                rate = round((acc / tot) * 100, 1)
                item["AcceptanceRate"] = rate
                item["acceptance_rate"] = rate
                item["TotalSubmissions"] = tot
                item["AcceptedSubmissions"] = acc
            else:
                item["AcceptanceRate"] = 0.0
                item["acceptance_rate"] = 0.0
                item["TotalSubmissions"] = 0
                item["AcceptedSubmissions"] = 0

        return items
    except Exception as e:
        logger.warning(f"Error scanning DynamoDB Problems: {e}")
        return []


def get_problem_details(problem_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve problem details by ID from DynamoDB with real-time submission & like stats"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        if item:
            item = convert_decimals(item)

            # 1. Tính toán số lượng bài nộp thực tế và tỉ lệ chấp nhận (Acceptance Rate) từ Submissions table
            try:
                sub_res = submissions_table.scan(
                    FilterExpression="ProblemID = :pid",
                    ExpressionAttributeValues={":pid": problem_id}
                )
                subs = sub_res.get("Items", [])
                total_subs = len(subs)
                accepted_subs = sum(1 for s in subs if s.get("Status") == "Accepted")
                if total_subs > 0:
                    acc_rate = round((accepted_subs / total_subs * 100), 1)
                else:
                    acc_rate = 0.0
            except Exception as e:
                logger.warning(f"Error scanning submissions for problem {problem_id}: {e}")
                total_subs = 0
                accepted_subs = 0
                acc_rate = 0.0

            liked_by = item.get("LikedBy", [])
            if not isinstance(liked_by, list):
                liked_by = []
            disliked_by = item.get("DislikedBy", [])
            if not isinstance(disliked_by, list):
                disliked_by = []

            item["TotalSubmissions"] = total_subs
            item["AcceptedSubmissions"] = accepted_subs
            item["AcceptanceRate"] = f"{acc_rate:.1f}%"
            item["LikesCount"] = len(liked_by) if liked_by else int(item.get("Likes", 0))
            item["DislikesCount"] = len(disliked_by) if disliked_by else int(item.get("Dislikes", 0))
            item["LikedBy"] = liked_by
            item["DislikedBy"] = disliked_by

            return item
    except Exception as e:
        logger.warning(f"Failed to get problem {problem_id} from DynamoDB: {e}")

    return None


def get_sample_testcases_for_run(problem_id: str) -> List[Dict[str, str]]:
    """
    Get sample testcases (is_sample = True) for RUN CODE feature.
    """
    all_tc = get_all_testcases_for_submit(problem_id)
    sample_tc = [tc for tc in all_tc if tc.get("is_sample", True)]
    return sample_tc if sample_tc else all_tc[:3]


def get_all_testcases_for_submit(problem_id: str) -> List[Dict[str, Any]]:
    """
    Get full suite of testcases for SUBMIT CODE feature.
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
        logger.warning(f"Error querying TestCases for {problem_id}: {e}")
    return []

# --- ADMIN SERVICE FUNCTIONS FOR PROBLEMS & TESTCASES ---

def get_problem_testcases_admin(problem_id: str) -> List[Dict[str, Any]]:
    """Get all testcases for a problem for Admin screen"""
    return get_all_testcases_for_submit(problem_id)


def save_problem_testcases(problem_id: str, testcases: List[Dict[str, Any]]) -> None:
    """Save/Update testcases for a problem in DynamoDB TestCases table"""
    try:
        # Delete old testcases
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
        logger.warning(f"Error deleting old testcases for {problem_id}: {e}")

    # Insert new testcases
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
            logger.error(f"Error saving testcase {tc_id} for {problem_id}: {e}")


def create_problem(problem_data: Dict[str, Any], testcases: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Create a new problem in DynamoDB with auto-slugified problem_id"""
    title = (problem_data.get("title") or "").strip()
    raw_id = (problem_data.get("problem_id") or "").strip()

    if raw_id:
        problem_id = slugify(raw_id)
    elif title:
        problem_id = slugify(title)
    else:
        problem_id = f"prob-{uuid.uuid4().hex[:8]}"

    if not problem_id:
        problem_id = f"prob-{uuid.uuid4().hex[:8]}"

    now_str = datetime.utcnow().isoformat()

    item = {
        "ProblemID": problem_id,
        "Title": problem_data.get("title", ""),
        "Difficulty": problem_data.get("difficulty", "Easy"),
        "Category": problem_data.get("category", "General"),
        "TimeLimit": Decimal(str(problem_data.get("time_limit", 2.0))),
        "MemoryLimit": int(problem_data.get("memory_limit", 256)),
        "TimeComplexity": problem_data.get("time_complexity", ""),
        "SpaceComplexity": problem_data.get("space_complexity", ""),
        "Description": problem_data.get("description", ""),
        "Constraints": problem_data.get("constraints", ""),
        "InitCode": problem_data.get("init_code") or {},
        "AcceptanceRate": Decimal("0.0"),
        "CreatedAt": now_str,
    }

    try:
        problems_table.put_item(Item=item)
    except Exception as e:
        logger.error(f"Error put_item DynamoDB Problems: {e}")
        raise RuntimeError(f"Could not save problem to Database: {e}")

    if testcases:
        save_problem_testcases(problem_id, testcases)

    return get_admin_problem_detail(problem_id)


def update_problem(problem_id: str, update_fields: Dict[str, Any], testcases: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Update a problem in DynamoDB"""
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
        "init_code": "InitCode",
    }

    for key, attr_name in field_mappings.items():
        if key in update_fields and update_fields[key] is not None:
            val = update_fields[key]
            if key == "time_limit":
                val = Decimal(str(val))
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
            logger.error(f"Error update_item DynamoDB Problems for {problem_id}: {e}")

    if testcases is not None:
        save_problem_testcases(problem_id, testcases)

    return get_admin_problem_detail(problem_id)


def delete_problem(problem_id: str) -> None:
    """Delete a problem and its testcases from DynamoDB"""
    try:
        problems_table.delete_item(Key={"ProblemID": problem_id})
    except Exception as e:
        logger.error(f"Error delete_item DynamoDB Problems for {problem_id}: {e}")

    try:
        tcs = testcases_table.scan(
            FilterExpression="ProblemID = :pid",
            ExpressionAttributeValues={":pid": problem_id}
        ).get("Items", [])
        for tc in tcs:
            testcases_table.delete_item(Key={"ProblemID": problem_id, "TestCaseID": tc["TestCaseID"]})
    except Exception as e:
        logger.warning(f"Error cleaning up testcases for {problem_id}: {e}")


def get_admin_problem_detail(problem_id: str) -> Dict[str, Any]:
    """Get problem detail + testcases for Admin Edit screen"""
    prob = get_problem_details(problem_id) or {}
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
        "problem_id": prob.get("ProblemID") or prob.get("problem_id") or problem_id,
        "title": prob.get("Title") or prob.get("title") or "",
        "difficulty": prob.get("Difficulty") or prob.get("difficulty") or "Easy",
        "category": prob.get("Category") or prob.get("category") or "",
        "time_limit": float(prob.get("TimeLimit", prob.get("time_limit", 2.0))),
        "memory_limit": int(prob.get("MemoryLimit", prob.get("memory_limit", 256))),
        "time_complexity": prob.get("TimeComplexity") or prob.get("time_complexity") or "",
        "space_complexity": prob.get("SpaceComplexity") or prob.get("space_complexity") or "",
        "description": prob.get("Description") or prob.get("description") or "",
        "constraints": prob.get("Constraints") or prob.get("constraints") or "",
        "init_code": prob.get("InitCode") or prob.get("init_code") or {},
        "acceptance_rate": float(prob.get("AcceptanceRate", prob.get("acceptance_rate", 0.0))),
        "created_at": prob.get("CreatedAt") or prob.get("created_at") or "",
        "testcases": formatted_tcs
    }


def toggle_like_problem(problem_id: str, user_id: str) -> Dict[str, Any]:
    """Toggle Like for a user on a problem"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        if not item:
            raise ValueError("Problem not found")

        liked_by = item.get("LikedBy", [])
        if not isinstance(liked_by, list):
            liked_by = []
        disliked_by = item.get("DislikedBy", [])
        if not isinstance(disliked_by, list):
            disliked_by = []

        user_liked = False
        if user_id in liked_by:
            liked_by.remove(user_id)
        else:
            liked_by.append(user_id)
            user_liked = True
            if user_id in disliked_by:
                disliked_by.remove(user_id)

        likes_count = len(liked_by)
        dislikes_count = len(disliked_by)

        problems_table.update_item(
            Key={"ProblemID": problem_id},
            UpdateExpression="SET LikedBy = :lb, DislikedBy = :db, Likes = :lc, Dislikes = :dc",
            ExpressionAttributeValues={
                ":lb": liked_by,
                ":db": disliked_by,
                ":lc": likes_count,
                ":dc": dislikes_count
            }
        )

        return {
            "likes_count": likes_count,
            "dislikes_count": dislikes_count,
            "user_liked": user_liked,
            "user_disliked": False
        }
    except Exception as e:
        logger.error(f"Error toggling like for problem {problem_id}: {e}")
        raise e


def toggle_dislike_problem(problem_id: str, user_id: str) -> Dict[str, Any]:
    """Toggle Dislike for a user on a problem"""
    try:
        response = problems_table.get_item(Key={"ProblemID": problem_id})
        item = response.get("Item")
        if not item:
            raise ValueError("Problem not found")

        liked_by = item.get("LikedBy", [])
        if not isinstance(liked_by, list):
            liked_by = []
        disliked_by = item.get("DislikedBy", [])
        if not isinstance(disliked_by, list):
            disliked_by = []

        user_disliked = False
        if user_id in disliked_by:
            disliked_by.remove(user_id)
        else:
            disliked_by.append(user_id)
            user_disliked = True
            if user_id in liked_by:
                liked_by.remove(user_id)

        likes_count = len(liked_by)
        dislikes_count = len(disliked_by)

        problems_table.update_item(
            Key={"ProblemID": problem_id},
            UpdateExpression="SET LikedBy = :lb, DislikedBy = :db, Likes = :lc, Dislikes = :dc",
            ExpressionAttributeValues={
                ":lb": liked_by,
                ":db": disliked_by,
                ":lc": likes_count,
                ":dc": dislikes_count
            }
        )

        return {
            "likes_count": likes_count,
            "dislikes_count": dislikes_count,
            "user_liked": False,
            "user_disliked": user_disliked
        }
    except Exception as e:
        logger.error(f"Error toggling dislike for problem {problem_id}: {e}")
        raise e


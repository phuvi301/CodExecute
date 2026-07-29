import os
import sys
import random
from pathlib import Path
from decimal import Decimal

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from botocore.exceptions import ClientError
from app.core.aws import s3_client, dynamodb_resource
os.environ["EXECUTION_MODE"] = "tmp"
from app.core.config import settings
settings.EXECUTION_MODE = "tmp"
from app.services import problem_service, submissions_service
from lambda_worker import process_single_submission

BUCKET_NAME = settings.S3_TESTCASE_BUCKET
problems_table = dynamodb_resource.Table(settings.DYNAMODB_PROBLEMS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)

TWO_SUM_PROBLEM = {
    "ProblemID": "two-sum",
    "Title": "Two Sum",
    "Difficulty": "Easy",
    "Category": "Array & Hash Table",
    "AcceptanceRate": Decimal("57.9"),
    "TimeLimit": Decimal("2.0"),
    "MemoryLimit": 256,
    "TimeComplexity": "O(N)",
    "SpaceComplexity": "O(N)",
    "Description": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

### Input format:
- Line 1: Space-separated integers representing array `nums`.
- Line 2: Integer `target`.

### Output format:
- Space-separated indices `i j` of the two numbers.

### Example 1:
- **Input**:
```
2 7 11 15
9
```
- **Output**: `0 1`
- **Explanation**: Because `nums[0] + nums[1] == 9`, we return `0 1`.

### Example 2:
- **Input**:
```
3 2 4
6
```
- **Output**: `1 2`

### Example 3:
- **Input**:
```
3 3
6
```
- **Output**: `0 1`""",
    "Constraints": """2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.""",
    "Examples": [
        {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "Because nums[0] + nums[1] == 9, we return 0 1."},
        {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] == 6, we return 1 2."},
        {"input": "3 3\n6", "output": "0 1", "explanation": "nums[0] + nums[1] == 6, we return 0 1."}
    ]
}


def ensure_bucket():
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
        print(f"✅ S3 Bucket '{BUCKET_NAME}' existing.")
    except ClientError as e:
        print(f"⚠️ S3 Bucket warning: {e}")


def seed_problem_to_db():
    print("🚀 Seed problem 'Two Sum' vào DynamoDB...")
    try:
        problems_table.put_item(Item=TWO_SUM_PROBLEM)
        # Seed alias ID "1" as well if needed
        item_alias = dict(TWO_SUM_PROBLEM)
        item_alias["ProblemID"] = "1"
        problems_table.put_item(Item=item_alias)
        print("✅ Đã lưu bài toán 'two-sum' và '1' vào DynamoDB Problems table thành công!")
    except Exception as e:
        print(f"❌ Lỗi lưu problem vào DynamoDB: {e}")


def generate_two_sum_tc(i: int):
    if i == 1:
        return "2 7 11 15\n9", "0 1"
    elif i == 2:
        return "3 2 4\n6", "1 2"
    elif i == 3:
        return "3 3\n6", "0 1"
    
    random.seed(i * 1000 + 7)
    while True:
        if i <= 15:
            n = random.randint(2, 20)
            low, high = -200, 200
        elif i <= 35:
            n = random.randint(30, 200)
            low, high = -10000, 10000
        else:
            n = random.randint(500, 1500)
            low, high = -1000000, 1000000

        if high - low + 1 < n:
            high = low + n * 10

        nums = random.sample(range(low, high + 1), n)
        idx1 = random.randint(0, n - 2)
        idx2 = random.randint(idx1 + 1, n - 1)
        target = nums[idx1] + nums[idx2]

        seen = {}
        pair_count = 0
        valid = True
        for idx, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                pair_count += 1
                if pair_count > 1:
                    valid = False
                    break
            seen[num] = idx

        if valid and pair_count == 1:
            input_text = f"{' '.join(map(str, nums))}\n{target}"
            output_text = f"{idx1} {idx2}"
            return input_text, output_text


def seed_50_testcases():
    print("\n🚀 Đang khởi tạo và lưu 50 testcase cho Two Sum vào S3 và DynamoDB...")
    ensure_bucket()

    problem_ids = ["two-sum", "1"]
    
    for pid in problem_ids:
        # Delete old testcases for pid
        try:
            old_items = testcases_table.scan(
                FilterExpression="ProblemID = :pid",
                ExpressionAttributeValues={":pid": pid}
            ).get("Items", [])
            for item in old_items:
                testcases_table.delete_item(Key={"ProblemID": pid, "TestCaseID": item["TestCaseID"]})
        except Exception as e:
            print(f"  ⚠️ Cảnh báo dọn dẹp testcases cũ: {e}")

        success_count = 0
        for i in range(1, 51):
            input_text, output_text = generate_two_sum_tc(i)

            input_key = f"{pid}/input/{i}.txt"
            output_key = f"{pid}/output/{i}.txt"

            # 1. Upload to S3 if available
            try:
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=input_key,
                    Body=input_text.encode('utf-8'),
                    ContentType='text/plain'
                )
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=output_key,
                    Body=output_text.encode('utf-8'),
                    ContentType='text/plain'
                )
            except Exception as e:
                pass

            # 2. Save into DynamoDB TestCases table
            tc_item = {
                "ProblemID": pid,
                "TestCaseID": str(i),
                "S3InputKey": input_key,
                "S3OutputKey": output_key,
                "IsSample": (i <= 3),
                "Input": input_text,
                "Output": output_text,
                "InputPreview": input_text[:150],
                "OutputPreview": output_text[:150]
            }
            try:
                testcases_table.put_item(Item=tc_item)
                success_count += 1
            except Exception as e:
                print(f"  ❌ Lỗi lưu DB testcase {i} cho {pid}: {e}")

        print(f"✅ Hoàn tất lưu {success_count}/50 testcases cho problem '{pid}'.")


def run_submissions():
    print("\n🚀 Tiến hành nộp các bài submission mẫu thực tế để kiểm thử hệ thống...")

    # Python solution 1: Đúng (Optimized Hash Map)
    correct_python_code = """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    solve()"""

    # Python solution 2: Bug (Sai kết quả ở 1 số testcase)
    buggy_python_code = """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                # Bug cố ý: in sai thứ tự nếu i > 0
                print(f"{j} {i}")
                return

if __name__ == "__main__":
    solve()"""

    # C++ Solution: Đúng
    cpp_code = """#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    vector<int> nums;
    int val;
    while (cin >> val) {
        nums.push_back(val);
    }
    if (nums.size() < 2) return 0;
    int target = nums.back();
    nums.pop_back();

    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (mp.find(diff) != mp.end()) {
            cout << mp[diff] << " " << i << endl;
            return 0;
        }
        mp[nums[i]] = i;
    }
    return 0;
}"""

    sub_configs = [
        ("sub_python_correct", "python", correct_python_code, "Accepted"),
        ("sub_python_wrong", "python", buggy_python_code, "Wrong Answer"),
        ("sub_cpp_correct", "cpp", cpp_code, "Accepted")
    ]

    for sub_id, lang, code, expected_status in sub_configs:
        print(f"\n--- Gửi submission: {sub_id} ({lang}) ---")
        # 1. Tạo pending submission
        submissions_service.create_pending_submission(
            submission_id=sub_id,
            user_id="user_test_demo",
            problem_id="two-sum",
            language=lang,
            code=code
        )

        # 2. Xử lý chấm bài trực tiếp
        res = process_single_submission(
            submission_id=sub_id,
            problem_id="two-sum",
            language=lang,
            code=code
        )

        print(f"  └─ Status: {res.get('Status')}")
        print(f"  └─ Testcases Passed: {res.get('PassedTestCases')}/{res.get('TotalTestCases')}")
        print(f"  └─ Execution Time: {res.get('ExecutionTime')}s")
        if res.get('ErrorMessage'):
            print(f"  └─ Error Message:\n{res.get('ErrorMessage')}")


if __name__ == '__main__':
    seed_problem_to_db()
    seed_50_testcases()
    run_submissions()

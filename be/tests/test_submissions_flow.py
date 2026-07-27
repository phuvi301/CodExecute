import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core import security
from app.executor import runner
from lambda_worker import process_single_submission

class TestSubmissionsFlow(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.test_user_id = "test-user-uuid-9999"
        self.test_token = security.create_token(data={"sub": self.test_user_id, "role": "user"})
        self.headers = {"Authorization": f"Bearer {self.test_token}"}

    @patch("app.services.submissions_service.submissions_table")
    @patch("app.services.sqs_service.sqs_client")
    def test_create_submission_pending_flow(self, mock_sqs_client, mock_submissions_table):
        # Setup mocks
        mock_submissions_table.put_item.return_value = {}
        mock_sqs_client.send_message.return_value = {"MessageId": "msg-12345"}

        payload = {
            "problem_id": "prob_two_sum",
            "language": "python",
            "code": "print('Hello World')"
        }

        response = self.client.post("/api/v1/submissions", json=payload, headers=self.headers)

        self.assertEqual(response.status_code, 201)
        data = response.json()

        # Kiểm tra status khởi tạo là Pending
        self.assertEqual(data["status"], "Pending")
        self.assertEqual(data["user_id"], self.test_user_id)
        self.assertEqual(data["problem_id"], "prob_two_sum")
        self.assertEqual(data["code"], "print('Hello World')")

        # Kiểm tra code được lưu vào DynamoDB
        mock_submissions_table.put_item.assert_called_once()
        saved_item = mock_submissions_table.put_item.call_args[1]["Item"]
        self.assertEqual(saved_item["Status"], "Pending")
        self.assertEqual(saved_item["Code"], "print('Hello World')")

    def test_runner_tmp_creation_and_cleanup(self):
        submission_id = "test_sub_cleanup_123"
        code = "import sys\nline = sys.stdin.read().strip()\nprint(f'Hello {line}')"
        testcases = [
            {"input": "World", "output": "Hello World"}
        ]

        result = runner.execute_submission(
            submission_id=submission_id,
            language="python",
            code=code,
            testcases=testcases,
            time_limit=2.0,
            memory_limit=256
        )

        # Kiểm tra kết quả chấm bài
        self.assertEqual(result["status"], "Accepted")
        self.assertEqual(result["passed_testcases"], 1)

        # Kiểm tra dọn dẹp file tạm trong /tmp
        tmp_dir = runner.get_temp_dir()
        work_dir = os.path.join(tmp_dir, f"sub_{submission_id}")
        self.assertFalse(os.path.exists(work_dir), "Thư mục tạm trong /tmp phải được xóa sau khi chấm xong")

    @patch("app.services.submissions_service.submissions_table")
    @patch("app.services.submissions_service.get_problem_by_id")
    @patch("app.services.submissions_service.get_testcases_with_content")
    def test_process_single_submission_worker(self, mock_get_tc, mock_get_problem, mock_submissions_table):
        mock_get_problem.return_value = {"ProblemID": "p1", "TimeLimit": 2.0, "MemoryLimit": 256}
        mock_get_tc.return_value = [
            {"input": "3 5", "output": "8"}
        ]
        mock_submissions_table.update_item.return_value = {
            "Attributes": {
                "SubmissionID": "sub_999",
                "Status": "Accepted",
                "PassedTestCases": 1,
                "TotalTestCases": 1
            }
        }

        python_code = "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"
        
        result = process_single_submission(
            submission_id="sub_999",
            problem_id="p1",
            language="python",
            code=python_code
        )

        mock_submissions_table.update_item.assert_called_once()
        call_kwargs = mock_submissions_table.update_item.call_args[1]
        self.assertEqual(call_kwargs["ExpressionAttributeValues"][":status"], "Accepted")
        self.assertEqual(call_kwargs["ExpressionAttributeValues"][":ptc"], 1)

if __name__ == "__main__":
    unittest.main()

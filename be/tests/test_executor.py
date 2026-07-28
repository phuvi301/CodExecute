import os
import json
import unittest
from unittest.mock import patch, MagicMock

from app.executor import runner
from app.core.config import settings


class TestExecutor(unittest.TestCase):

    def test_execute_submission_local_success(self):
        submission_id = "test_exec_local_001"
        code = "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"
        testcases = [{"input": "5 10", "output": "15"}]

        result = runner.execute_submission_local(
            submission_id=submission_id,
            language="python",
            code=code,
            testcases=testcases,
            time_limit=2.0,
            memory_limit=256
        )

        self.assertEqual(result["status"], "Accepted")
        self.assertEqual(result["passed_testcases"], 1)

        # Kiểm tra dọn dẹp thư mục tạm trong /tmp
        tmp_dir = runner.get_temp_dir()
        work_dir = os.path.join(tmp_dir, f"sub_{submission_id}")
        self.assertFalse(os.path.exists(work_dir), "Thư mục tạm trong /tmp phải được dọn dẹp sau khi chấm xong")

    @patch("app.executor.runner.logs_client")
    @patch("app.executor.runner.ecs_client")
    def test_execute_submission_ecs_success(self, mock_ecs_client, mock_logs_client):
        submission_id = "sub_ecs_123"

        # Mock ecs_client.run_task
        mock_ecs_client.run_task.return_value = {
            "tasks": [{"taskArn": "arn:aws:ecs:ap-southeast-1:123456789012:task/cluster/task-xyz-999"}]
        }

        # Mock waiter
        mock_waiter = MagicMock()
        mock_ecs_client.get_waiter.return_value = mock_waiter

        # Mock logs_client.get_log_events
        expected_result = {
            "status": "Accepted",
            "execution_time": 0.05,
            "memory_used": 15.0,
            "passed_testcases": 2,
            "total_testcases": 2,
            "error_message": ""
        }
        mock_logs_client.get_log_events.return_value = {
            "events": [
                {"message": "Task started"},
                {"message": "---RESULT_START---"},
                {"message": json.dumps(expected_result)},
                {"message": "---RESULT_END---"}
            ]
        }

        result = runner.execute_submission_ecs(
            submission_id=submission_id,
            language="python",
            code="print(1)",
            testcases=[{"input": "", "output": "1"}],
            time_limit=2.0,
            memory_limit=256
        )

        self.assertEqual(result["status"], "Accepted")
        self.assertEqual(result["passed_testcases"], 2)
        mock_ecs_client.run_task.assert_called_once()
        mock_logs_client.get_log_events.assert_called_once()

    @patch("app.executor.runner.execute_submission_ecs")
    def test_execute_submission_router_ecs_mode(self, mock_exec_ecs):
        mock_exec_ecs.return_value = {"status": "Accepted"}

        with patch.object(settings, "EXECUTION_MODE", "ecs"):
            res = runner.execute_submission(
                submission_id="s1",
                language="python",
                code="pass",
                testcases=[]
            )
            self.assertEqual(res["status"], "Accepted")
            mock_exec_ecs.assert_called_once()

    @patch("app.executor.runner.execute_submission_local")
    def test_execute_submission_router_tmp_mode(self, mock_exec_local):
        mock_exec_local.return_value = {"status": "Accepted"}

        with patch.object(settings, "EXECUTION_MODE", "tmp"):
            res = runner.execute_submission(
                submission_id="s2",
                language="python",
                code="pass",
                testcases=[]
            )
            self.assertEqual(res["status"], "Accepted")
            mock_exec_local.assert_called_once()


if __name__ == "__main__":
    unittest.main()

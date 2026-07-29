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

    @patch("app.executor.runner.execute_submission_local")
    def test_execute_submission_entrypoint(self, mock_exec_local):
        mock_exec_local.return_value = {"status": "Accepted"}

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

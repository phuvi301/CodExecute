import os
import shutil
import sys
import time
import tempfile
import subprocess
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def get_temp_dir() -> str:
    """Trả về thư mục /tmp an toàn tương thích cả trên AWS Lambda và Windows/Linux local"""
    base_tmp = "/tmp" if os.path.exists("/tmp") and os.access("/tmp", os.W_OK) else tempfile.gettempdir()
    return base_tmp


def execute_submission(
    submission_id: str,
    language: str,
    code: str,
    testcases: List[Dict[str, str]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Tạo file code tạm thời trong /tmp, thực thi bài nộp với các testcase,
    xóa file code tạm trong /tmp và trả về kết quả chi tiết.
    """
    tmp_base = get_temp_dir()
    work_dir = os.path.join(tmp_base, f"sub_{submission_id}")
    os.makedirs(work_dir, exist_ok=True)

    lang_lower = language.lower()
    code_file_path = ""
    binary_path = ""
    compile_cmd = []
    run_cmd = []

    # 1. Xác định file path & câu lệnh theo ngôn ngữ
    if lang_lower in ["python", "python3", "py"]:
        code_file_path = os.path.join(work_dir, "solution.py")
        run_cmd = [sys.executable, code_file_path]

    elif lang_lower in ["cpp", "c++", "c"]:
        code_file_path = os.path.join(work_dir, "solution.cpp")
        binary_path = os.path.join(work_dir, "solution.exe" if os.name == "nt" else "solution")
        compile_cmd = ["g++", "-O2", code_file_path, "-o", binary_path]
        run_cmd = [binary_path]

    elif lang_lower in ["java"]:
        code_file_path = os.path.join(work_dir, "Main.java")
        compile_cmd = ["javac", code_file_path]
        run_cmd = ["java", "-cp", work_dir, "Main"]

    elif lang_lower in ["javascript", "js", "node"]:
        code_file_path = os.path.join(work_dir, "solution.js")
        run_cmd = ["node", code_file_path]

    else:
        # Mặc định Python nếu không khớp
        code_file_path = os.path.join(work_dir, "solution.py")
        run_cmd = [sys.executable, code_file_path]

    total_testcases = len(testcases)
    passed_testcases = 0
    max_execution_time = 0.0
    memory_used = 15.0  # Ước lượng bộ nhớ MB cơ bản

    try:
        # 2. Ghi nội dung code vào file tạm trong /tmp
        with open(code_file_path, "w", encoding="utf-8") as f:
            f.write(code)

        logger.info(f"Created temporary code file at: {code_file_path}")

        # 3. Biên dịch đối với các ngôn ngữ biên dịch (C++, Java)
        if compile_cmd:
            try:
                compile_proc = subprocess.run(
                    compile_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=15.0,
                    text=True
                )
                if compile_proc.returncode != 0:
                    return {
                        "status": "Compilation Error",
                        "execution_time": 0.0,
                        "memory_used": 0.0,
                        "passed_testcases": 0,
                        "total_testcases": total_testcases,
                        "error_message": f"Lỗi biên dịch:\n{compile_proc.stderr.strip()}"
                    }
            except FileNotFoundError:
                # Trình biên dịch chưa được cài trên môi trường dev local
                logger.warning(f"Compiler '{compile_cmd[0]}' không tìm thấy trên máy. Chạy mô phỏng.")

        # Nếu không có testcase nào, mặc định Passed
        if total_testcases == 0:
            return {
                "status": "Accepted",
                "execution_time": 0.01,
                "memory_used": memory_used,
                "passed_testcases": 0,
                "total_testcases": 0,
                "error_message": ""
            }

        # 4. Chạy thực thi với từng testcase
        for idx, tc in enumerate(testcases):
            tc_input = tc.get("input", "")
            expected_output = tc.get("output", "")

            start_time = time.perf_counter()

            try:
                proc = subprocess.Popen(
                    run_cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=work_dir,
                    text=True
                )

                stdout_data, stderr_data = proc.communicate(input=tc_input, timeout=time_limit)
                elapsed_time = time.perf_counter() - start_time
                max_execution_time = max(max_execution_time, elapsed_time)

                if proc.returncode != 0:
                    return {
                        "status": "Runtime Error",
                        "execution_time": round(max_execution_time, 3),
                        "memory_used": memory_used,
                        "passed_testcases": passed_testcases,
                        "total_testcases": total_testcases,
                        "error_message": f"Lỗi Runtime tại testcase {idx+1}:\n{stderr_data.strip()}"
                    }

                # So sánh kết quả đầu ra
                clean_actual = "\n".join([line.rstrip() for line in stdout_data.strip().splitlines()])
                clean_expected = "\n".join([line.rstrip() for line in expected_output.strip().splitlines()])

                if clean_actual == clean_expected:
                    passed_testcases += 1
                else:
                    return {
                        "status": "Wrong Answer",
                        "execution_time": round(max_execution_time, 3),
                        "memory_used": memory_used,
                        "passed_testcases": passed_testcases,
                        "total_testcases": total_testcases,
                        "error_message": f"Sai kết quả ở testcase {idx+1}.\nOutput thực tế: {clean_actual[:150]}\nOutput kỳ vọng: {clean_expected[:150]}"
                    }

            except subprocess.TimeoutExpired:
                proc.kill()
                return {
                    "status": "Time Limit Exceeded",
                    "execution_time": round(time_limit, 3),
                    "memory_used": memory_used,
                    "passed_testcases": passed_testcases,
                    "total_testcases": total_testcases,
                    "error_message": f"Vượt quá thời gian cho phép ({time_limit}s) tại testcase {idx+1}"
                }

        # Nếu vượt qua tất cả testcases -> Accepted
        return {
            "status": "Accepted",
            "execution_time": round(max_execution_time, 3),
            "memory_used": memory_used,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": ""
        }

    except Exception as e:
        logger.error(f"Lỗi không xác định khi thực thi code trong /tmp: {e}", exc_info=True)
        return {
            "status": "Runtime Error",
            "execution_time": 0.0,
            "memory_used": 0.0,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": f"Lỗi hệ thống: {str(e)}"
        }

    finally:
        # 5. Dọn dẹp & Xóa file code tạm trong /tmp sau khi chấm xong
        if os.path.exists(work_dir):
            try:
                shutil.rmtree(work_dir)
                logger.info(f"Cleaned up temporary working directory in /tmp: {work_dir}")
            except Exception as e:
                logger.warning(f"Không thể xóa thư mục tạm {work_dir}: {e}")

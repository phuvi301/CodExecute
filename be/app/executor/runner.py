import os
import json
import shutil
import sys
import time
import tempfile
import subprocess
import logging
from typing import List, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_temp_dir() -> str:
    """Trả về thư mục /tmp an toàn tương thích cả trên AWS Lambda và Windows/Linux local"""
    base_tmp = "/tmp" if os.path.exists("/tmp") and os.access("/tmp", os.W_OK) else tempfile.gettempdir()
    return base_tmp


def normalize_language(lang: str) -> str:
    """Standardize language key to python, cpp, java, javascript"""
    l = (lang or "").lower().strip()
    if l in ["cpp", "c++", "c"]:
        return "cpp"
    if l in ["javascript", "js", "node"]:
        return "javascript"
    if l in ["java"]:
        return "java"
    if l in ["python", "python3", "py"]:
        return "python"
    return l


def get_driver_code_for_lang(driver_dict: Any, language: str) -> str:
    """Retrieve driver code matching normalized language key"""
    if not isinstance(driver_dict, dict):
        return ""
    lang_key = normalize_language(language)
    return driver_dict.get(lang_key) or driver_dict.get(language.lower()) or driver_dict.get(language) or ""


def execute_submission_local(
    submission_id: str,
    language: str,
    code: str,
    testcases: List[Dict[str, str]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Thực thi bài nộp trực tiếp trên máy chủ / container cục bộ qua subprocess trong /tmp.
    """
    import re
    tmp_base = get_temp_dir()
    work_dir = os.path.join(tmp_base, f"sub_{submission_id}")
    os.makedirs(work_dir, exist_ok=True)

    lang_key = normalize_language(language)
    code_file_path = ""
    binary_path = ""
    compile_cmd = []
    run_cmd = []

    # 1. Xác định file path & câu lệnh theo ngôn ngữ
    if lang_key == "python":
        code_file_path = os.path.join(work_dir, "solution.py")
        run_cmd = [sys.executable, code_file_path]

    elif lang_key == "cpp":
        code_file_path = os.path.join(work_dir, "solution.cpp")
        binary_path = os.path.join(work_dir, "solution.exe" if os.name == "nt" else "solution")
        
        # Prioritize standard system PATH compiler (used on Linux / Docker Production)
        compiler = shutil.which("g++") or shutil.which("clang++") or shutil.which("gcc")

        # Fallback to Windows custom MinGW / w64devkit paths if on Windows
        if not compiler and os.name == "nt":
            custom_gpp_paths = [
                r"C:\Users\ASUS\w64devkit\w64devkit\bin\g++.exe",
                r"C:\Users\ASUS\w64devkit\bin\g++.exe",
                r"C:\w64devkit\bin\g++.exe",
                r"C:\msys64\ucrt64\bin\g++.exe",
                r"C:\msys64\mingw64\bin\g++.exe",
                r"C:\MinGW\bin\g++.exe",
            ]
            compiler = next((p for p in custom_gpp_paths if os.path.exists(p)), None)

        if not compiler:
            compiler = "g++"

        compile_cmd = [compiler, "-O2", code_file_path, "-o", binary_path]
        run_cmd = [binary_path]

    elif lang_key == "java":
        # Chuẩn hóa: Thay 'public class Solution' thành 'class Solution' để javac Main.java không báo lỗi file name mismatch
        code = re.sub(r'public\s+class\s+(?!Main\b)', 'class ', code)
        code_file_path = os.path.join(work_dir, "Main.java")
        
        javac_bin = shutil.which("javac") or "javac"
        java_bin = shutil.which("java") or "java"
        compile_cmd = [javac_bin, code_file_path]
        run_cmd = [java_bin, "-cp", work_dir, "Main"]

    elif lang_key == "javascript":
        code_file_path = os.path.join(work_dir, "solution.js")
        node_bin = shutil.which("node") or "node"
        run_cmd = [node_bin, code_file_path]

    else:
        code_file_path = os.path.join(work_dir, "solution.py")
        run_cmd = [sys.executable, code_file_path]

    total_testcases = len(testcases)
    passed_testcases = 0
    max_execution_time = 0.0
    memory_used = 15.0

    try:
        # 2. Ghi nội dung code vào file tạm
        with open(code_file_path, "w", encoding="utf-8") as f:
            f.write(code)

        logger.info(f"Created temporary code file at: {code_file_path}")

        # 3. Biên dịch đối với các ngôn ngữ biên dịch (C++, Java)
        if compile_cmd:
            compile_env = os.environ.copy()
            target_compiler = compile_cmd[0]
            if target_compiler and os.path.isabs(target_compiler):
                compiler_dir = os.path.dirname(target_compiler)
                compile_env["PATH"] = compiler_dir + os.pathsep + compile_env.get("PATH", "")

            try:
                compile_proc = subprocess.run(
                    compile_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=15.0,
                    text=True,
                    env=compile_env
                )
                if compile_proc.returncode != 0:
                    err_text = compile_proc.stderr.strip() or compile_proc.stdout.strip()
                    return {
                        "status": "Compilation Error",
                        "execution_time": 0.0,
                        "memory_used": 0.0,
                        "passed_testcases": 0,
                        "total_testcases": total_testcases,
                        "error_message": f"Compilation Error:\n{err_text}"
                    }
                
                # Verify that binary executable was actually produced
                if binary_path and not os.path.exists(binary_path):
                    return {
                        "status": "Compilation Error",
                        "execution_time": 0.0,
                        "memory_used": 0.0,
                        "passed_testcases": 0,
                        "total_testcases": total_testcases,
                        "error_message": f"Compilation Error: File thực thi '{os.path.basename(binary_path)}' không được tạo sau khi biên dịch."
                    }

            except FileNotFoundError:
                compiler_name = compile_cmd[0]
                logger.warning(f"Compiler '{compiler_name}' not found on host system.")
                return {
                    "status": "Compilation Error",
                    "execution_time": 0.0,
                    "memory_used": 0.0,
                    "passed_testcases": 0,
                    "total_testcases": total_testcases,
                    "error_message": f"Compilation Error: Trình biên dịch '{compiler_name}' chưa được cài đặt hoặc không tìm thấy trong PATH hệ thống."
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "Compilation Error",
                    "execution_time": 0.0,
                    "memory_used": 0.0,
                    "passed_testcases": 0,
                    "total_testcases": total_testcases,
                    "error_message": "Compilation Error: Quá thời gian biên dịch (15 giây)."
                }

        # If no testcases, default to Accepted
        if total_testcases == 0:
            return {
                "status": "Accepted",
                "execution_time": 0.01,
                "memory_used": memory_used,
                "passed_testcases": 0,
                "total_testcases": 0,
                "error_message": ""
            }

        # 4. Run execution for each testcase
        for idx, tc in enumerate(testcases):
            tc_input = (tc.get("input") or tc.get("Input") or tc.get("InputPreview") or "")
            expected_output = (tc.get("output") or tc.get("Output") or tc.get("OutputPreview") or "")

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
                    err_msg = stderr_data.strip() or stdout_data.strip() or f"Mã thoát chương trình: {proc.returncode}"
                    return {
                        "status": "Runtime Error",
                        "execution_time": round(max_execution_time, 3),
                        "memory_used": memory_used,
                        "passed_testcases": passed_testcases,
                        "total_testcases": total_testcases,
                        "error_message": f"Runtime Error on testcase {idx+1}:\n{err_msg}"
                    }

                # Compare output
                clean_actual = "\n".join([line.rstrip() for line in stdout_data.strip().splitlines()])
                clean_expected = "\n".join([line.rstrip() for line in expected_output.strip().splitlines()])

                if clean_actual == clean_expected:
                    passed_testcases += 1
                else:
                    display_input = tc_input[:500] if tc_input.strip() else "(empty input)"
                    display_actual = clean_actual[:500] if clean_actual.strip() else "(empty output)"
                    display_expected = clean_expected[:500] if clean_expected.strip() else "(empty output)"

                    return {
                        "status": "Wrong Answer",
                        "execution_time": round(max_execution_time, 3),
                        "memory_used": memory_used,
                        "passed_testcases": passed_testcases,
                        "total_testcases": total_testcases,
                        "error_message": f"Wrong Answer on testcase {idx+1}.\nInput:\n{display_input}\n\nActual Output:\n{display_actual}\n\nExpected Output:\n{display_expected}"
                    }

            except FileNotFoundError:
                runner_prog = run_cmd[0] if run_cmd else "executable"
                return {
                    "status": "Runtime Error",
                    "execution_time": 0.0,
                    "memory_used": 0.0,
                    "passed_testcases": passed_testcases,
                    "total_testcases": total_testcases,
                    "error_message": f"Runtime Error: Không tìm thấy trình thực thi '{runner_prog}' trong PATH hệ thống."
                }
            except subprocess.TimeoutExpired:
                proc.kill()
                return {
                    "status": "Time Limit Exceeded",
                    "execution_time": round(time_limit, 3),
                    "memory_used": memory_used,
                    "passed_testcases": passed_testcases,
                    "total_testcases": total_testcases,
                    "error_message": f"Time Limit Exceeded ({time_limit}s) on testcase {idx+1}"
                }

        return {
            "status": "Accepted",
            "execution_time": round(max_execution_time, 3),
            "memory_used": memory_used,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": ""
        }

    except Exception as e:
        logger.error(f"Unidentified error executing local code: {e}", exc_info=True)
        return {
            "status": "Runtime Error",
            "execution_time": 0.0,
            "memory_used": 0.0,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": f"System Error: {str(e)}"
        }

    finally:
        if os.path.exists(work_dir):
            try:
                shutil.rmtree(work_dir)
                logger.info(f"Cleaned up temporary working directory: {work_dir}")
            except Exception as e:
                logger.warning(f"Could not remove temporary directory {work_dir}: {e}")


def execute_submission(
    submission_id: str,
    language: str,
    code: str,
    testcases: List[Dict[str, str]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Hàm entrypoint chính để thực thi bài nộp (qua subprocess trực tiếp trong /tmp của máy hoặc Lambda).
    """
    return execute_submission_local(
        submission_id=submission_id,
        language=language,
        code=code,
        testcases=testcases,
        time_limit=time_limit,
        memory_limit=memory_limit
    )

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
from app.core.aws import ecs_client, logs_client

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


def execute_submission_ecs(
    submission_id: str,
    language: str,
    code: str,
    testcases: List[Dict[str, str]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Kích hoạt AWS ECS Task (Fargate) để thực thi bài nộp hoàn toàn cách ly trong container.
    """
    logger.info(f"[ECS Runner] Triggering ECS Task for submission {submission_id}")

    # Truyền tham số dưới dạng Container Environment Overrides
    container_overrides = [
        {
            "name": settings.ECS_CONTAINER_NAME,
            "environment": [
                {"name": "SUBMISSION_ID", "value": submission_id},
                {"name": "LANGUAGE", "value": language},
                {"name": "CODE", "value": code},
                {"name": "TESTCASES_JSON", "value": json.dumps(testcases)},
                {"name": "TIME_LIMIT", "value": str(time_limit)},
                {"name": "MEMORY_LIMIT", "value": str(memory_limit)},
                {"name": "EXECUTION_MODE", "value": "tmp"}  # Bên trong ECS container sẽ chạy mode tmp
            ]
        }
    ]

    subnets = [s.strip() for s in settings.ECS_SUBNET_IDS.split(",") if s.strip()]
    security_groups = [s.strip() for s in settings.ECS_SECURITY_GROUP_IDS.split(",") if s.strip()]

    network_config = {}
    if subnets:
        awsvpc = {"subnets": subnets, "assignPublicIp": "ENABLED"}
        if security_groups:
            awsvpc["securityGroups"] = security_groups
        network_config["awsvpcConfiguration"] = awsvpc

    try:
        run_task_kwargs = {
            "cluster": settings.ECS_CLUSTER_NAME,
            "taskDefinition": settings.ECS_TASK_DEFINITION,
            "launchType": "FARGATE",
            "overrides": {"containerOverrides": container_overrides}
        }
        if network_config:
            run_task_kwargs["networkConfiguration"] = network_config

        response = ecs_client.run_task(**run_task_kwargs)
        tasks = response.get("tasks", [])

        if not tasks:
            failures = response.get("failures", [])
            err_desc = ", ".join([f.get("reason", "Unknown") for f in failures])
            logger.error(f"Failed to create ECS Task: {err_desc}")
            return {
                "status": "Runtime Error",
                "execution_time": 0.0,
                "memory_used": 0.0,
                "passed_testcases": 0,
                "total_testcases": len(testcases),
                "error_message": f"ECS Task initialization error: {err_desc}"
            }

        task_arn = tasks[0]["taskArn"]
        task_id = task_arn.split("/")[-1]
        logger.info(f"ECS Task started with ARN: {task_arn} (ID: {task_id}). Waiting for completion...")

        # Wait for ECS Task to complete (up to 60s)
        waiter = ecs_client.get_waiter("tasks_stopped")
        waiter.wait(
            cluster=settings.ECS_CLUSTER_NAME,
            tasks=[task_arn],
            WaiterConfig={"Delay": 2, "MaxAttempts": 30}
        )

        # Get results from CloudWatch Logs
        log_stream_name = f"ecs/{settings.ECS_CONTAINER_NAME}/{task_id}"
        logger.info(f"Reading logs from log stream: {log_stream_name}")

        log_response = logs_client.get_log_events(
            logGroupName=settings.ECS_LOG_GROUP_NAME,
            logStreamName=log_stream_name,
            startFromHead=False
        )

        events = log_response.get("events", [])
        log_text = "\n".join([e.get("message", "") for e in events])

        # Read JSON block wrapped between ---RESULT_START--- and ---RESULT_END---
        if "---RESULT_START---" in log_text and "---RESULT_END---" in log_text:
            json_str = log_text.split("---RESULT_START---")[1].split("---RESULT_END---")[0].strip()
            result = json.loads(json_str)
            return result
        else:
            # Fallback if log JSON printed directly or partially extracted
            for line in reversed(log_text.splitlines()):
                line = line.strip()
                if line.startswith("{") and line.endswith("}") and "status" in line:
                    return json.loads(line)

            logger.warning(f"Could not find JSON result block in logs. Raw logs: {log_text[:300]}")
            return {
                "status": "Runtime Error",
                "execution_time": 0.0,
                "memory_used": 0.0,
                "passed_testcases": 0,
                "total_testcases": len(testcases),
                "error_message": f"ECS Task finished but did not return valid result:\n{log_text[:500]}"
            }

    except Exception as e:
        logger.error(f"Error executing code on ECS Task: {e}", exc_info=True)
        return {
            "status": "Runtime Error",
            "execution_time": 0.0,
            "memory_used": 0.0,
            "passed_testcases": 0,
            "total_testcases": len(testcases),
            "error_message": f"ECS Execution system error: {str(e)}"
        }


def execute_submission(
    submission_id: str,
    language: str,
    code: str,
    testcases: List[Dict[str, str]],
    time_limit: float = 2.0,
    memory_limit: int = 256
) -> Dict[str, Any]:
    """
    Hàm entrypoint chính để thực thi bài nộp.
    Tùy vào settings.EXECUTION_MODE mà chạy qua AWS ECS Task hay qua Local /tmp.
    """
    mode = getattr(settings, "EXECUTION_MODE", "tmp").lower()
    if mode == "ecs":
        return execute_submission_ecs(
            submission_id=submission_id,
            language=language,
            code=code,
            testcases=testcases,
            time_limit=time_limit,
            memory_limit=memory_limit
        )
    else:
        return execute_submission_local(
            submission_id=submission_id,
            language=language,
            code=code,
            testcases=testcases,
            time_limit=time_limit,
            memory_limit=memory_limit
        )


if __name__ == "__main__":
    # Khi runner được chạy trực tiếp bên trong ECS Container Task
    sub_id = os.environ.get("SUBMISSION_ID", "test_sub_ecs")
    lang = os.environ.get("LANGUAGE", "python")
    user_code = os.environ.get("CODE", "")
    tcs_raw = os.environ.get("TESTCASES_JSON", "[]")
    t_limit = float(os.environ.get("TIME_LIMIT", "2.0"))
    m_limit = int(os.environ.get("MEMORY_LIMIT", "256"))

    try:
        parsed_testcases = json.loads(tcs_raw)
    except Exception:
        parsed_testcases = []

    exec_result = execute_submission_local(
        submission_id=sub_id,
        language=lang,
        code=user_code,
        testcases=parsed_testcases,
        time_limit=t_limit,
        memory_limit=m_limit
    )

    print("---RESULT_START---")
    print(json.dumps(exec_result, ensure_ascii=False))
    print("---RESULT_END---")

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
        # 2. Ghi nội dung code vào file tạm
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

        return {
            "status": "Accepted",
            "execution_time": round(max_execution_time, 3),
            "memory_used": memory_used,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": ""
        }

    except Exception as e:
        logger.error(f"Lỗi không xác định khi thực thi code local: {e}", exc_info=True)
        return {
            "status": "Runtime Error",
            "execution_time": 0.0,
            "memory_used": 0.0,
            "passed_testcases": passed_testcases,
            "total_testcases": total_testcases,
            "error_message": f"Lỗi hệ thống: {str(e)}"
        }

    finally:
        if os.path.exists(work_dir):
            try:
                shutil.rmtree(work_dir)
                logger.info(f"Cleaned up temporary working directory: {work_dir}")
            except Exception as e:
                logger.warning(f"Không thể xóa thư mục tạm {work_dir}: {e}")


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
            logger.error(f"Khong the tao ECS Task: {err_desc}")
            return {
                "status": "Runtime Error",
                "execution_time": 0.0,
                "memory_used": 0.0,
                "passed_testcases": 0,
                "total_testcases": len(testcases),
                "error_message": f"Lỗi khởi tạo ECS Task: {err_desc}"
            }

        task_arn = tasks[0]["taskArn"]
        task_id = task_arn.split("/")[-1]
        logger.info(f"ECS Task started with ARN: {task_arn} (ID: {task_id}). Waiting for completion...")

        # Chờ ECS Task hoàn thành (chờ tối đa 60 giây)
        waiter = ecs_client.get_waiter("tasks_stopped")
        waiter.wait(
            cluster=settings.ECS_CLUSTER_NAME,
            tasks=[task_arn],
            WaiterConfig={"Delay": 2, "MaxAttempts": 30}
        )

        # Lấy kết quả từ CloudWatch Logs
        log_stream_name = f"ecs/{settings.ECS_CONTAINER_NAME}/{task_id}"
        logger.info(f"Reading logs from log stream: {log_stream_name}")

        log_response = logs_client.get_log_events(
            logGroupName=settings.ECS_LOG_GROUP_NAME,
            logStreamName=log_stream_name,
            startFromHead=False
        )

        events = log_response.get("events", [])
        log_text = "\n".join([e.get("message", "") for e in events])

        # Đọc khối JSON được bọc giữa ---RESULT_START--- và ---RESULT_END---
        if "---RESULT_START---" in log_text and "---RESULT_END---" in log_text:
            json_str = log_text.split("---RESULT_START---")[1].split("---RESULT_END---")[0].strip()
            result = json.loads(json_str)
            return result
        else:
            # Fallback nếu in log JSON trực tiếp hoặc bị trích xuất một phần
            for line in reversed(log_text.splitlines()):
                line = line.strip()
                if line.startswith("{") and line.endswith("}") and "status" in line:
                    return json.loads(line)

            logger.warning(f"Không tìm thấy khối JSON kết quả trong logs. Raw logs: {log_text[:300]}")
            return {
                "status": "Runtime Error",
                "execution_time": 0.0,
                "memory_used": 0.0,
                "passed_testcases": 0,
                "total_testcases": len(testcases),
                "error_message": f"ECS Task kết thúc nhưng không trả về kết quả hợp lệ:\n{log_text[:500]}"
            }

    except Exception as e:
        logger.error(f"Lỗi khi thực thi code trên ECS Task: {e}", exc_info=True)
        return {
            "status": "Runtime Error",
            "execution_time": 0.0,
            "memory_used": 0.0,
            "passed_testcases": 0,
            "total_testcases": len(testcases),
            "error_message": f"Lỗi hệ thống ECS Execution: {str(e)}"
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

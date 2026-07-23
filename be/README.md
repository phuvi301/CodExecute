# Backend
## Cách chạy backend
- Lần đầu chạy, tạo môi trường ảo venv:
```bash
python -m venv venv
```
- Kích hoạt môi trường ảo:
```bash
.\venv\Scripts\Activate
```
- Cài thư viện:
```bash
pip install -r requirements.txt
```
- Chạy backend (môi trường dev):
```bash
fastapi dev
```
- Server sẽ được chạy tại `http://127.0.0.1:8000`
## Cấu trúc thư mục
```
be/
├── app/                        # Mã nguồn chính của ứng dụng
│   ├── __init__.py
│   ├── api/                    # Quản lý các Router / Endpoints (FastAPI)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── problems.py     # API: Lấy danh sách đề bài, chi tiết đề
│   │   │   └── submissions.py  # API: Submit code, lấy trạng thái chấm bài
│   │   └── router.py           # Gom tất cả router v1 lại
│   │
│   ├── core/                   # Cấu hình hệ thống & AWS SDK
│   │   ├── __init__.py
│   │   ├── config.py           # Đọc biến môi trường (ENV variables)
│   │   └── aws.py              # Khởi tạo Boto3 clients (DynamoDB, SQS, S3)
│   │
│   ├── schemas/                # Pydantic Models (Validate dữ liệu đầu vào/ra)
│   │   ├── __init__.py
│   │   ├── problem.py          # Data shape cho đề bài
│   │   └── submission.py       # Data shape cho bài nộp
│   │
│   ├── services/               # Logic nghiệp vụ (Tương tác DB / Queue)
│   │   ├── __init__.py
│   │   ├── db_service.py       # Đọc/Ghi dữ liệu bảng DynamoDB
│   │   ├── sqs_service.py      # Đẩy job chấm bài vào SQS
│   │   └── s3_service.py       # Đọc file Test Cases từ S3
│   │
│   └── executor/               # Core Chấm Bài (Sandbox Execution)
│       ├── __init__.py
│       └── runner.py           # Ghi file ra /tmp, chạy subprocess & so sánh output
│
├── lambda_api.py               # [ENTRY POINT 1] AWS Lambda Handler cho API Gateway (FastAPI)
├── lambda_worker.py            # [ENTRY POINT 2] AWS Lambda Handler cho SQS Trigger (Worker)
│
├── tests/                      # Unit test & Integration test
│   ├── test_api.py
│   └── test_executor.py
│
├── .env.example                # File mẫu biến môi trường (Local)
├── requirements.txt            # Danh sách thư viện Python
├── template.yaml               # (Tùy chọn) File cấu hình AWS SAM để deploy tự động
└── README.md
```
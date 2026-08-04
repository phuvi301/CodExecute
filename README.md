# 🚀 CodExecute - Hệ Thống Chấm Bài Trực Tuyến & Mạng Xã Hội Lập Trình

<p align="center">
  <b>Nền tảng luyện tập thuật toán & chấm bài tự động (Online Judge) tích hợp tính năng cộng đồng</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688?style=for-the-badge&logo=fastapi" alt="Backend" />
  <img src="https://img.shields.io/badge/Cloud-AWS%20(DynamoDB%20%7C%20SQS%20%7C%20S3%20%7C%20Lambda)-FF9900?style=for-the-badge&logo=amazonaws" alt="AWS" />
  <img src="https://img.shields.io/badge/Sandbox-Docker-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

---

## 📌 Giới thiệu

**CodExecute** là hệ thống chấm bài lập trình tự động (Online Judge Platform) tương tự LeetCode và Codeforces, kết hợp với mạng xã hội học tập dành cho lập trình viên. System hỗ trợ biên dịch và thực thi mã nguồn đa ngôn ngữ trong môi trường Sandbox cách ly hoàn toàn, đảm bảo tính an toàn, bảo mật và hiệu năng cao.

### 💡 Điểm nổi bật:
- ⚡ **Chấm bài bất đồng bộ**: Sử dụng **AWS SQS** & **AWS Lambda Sandbox Container** giúp chấm bài nhanh chóng, không gây rẽ nhánh làm nghẽn API Server.
- 🔒 **Môi trường Sandbox bảo mật**: Docker Container hạn chế quyền truy cập tài nguyên (CPU, RAM, Network, Filesystem).
- 🌐 **Đa ngôn ngữ lập trình**: Hỗ trợ **Python 3**, **C++ 17**, **Java 17**, và **Node.js (JavaScript)**.
- 👥 **Mạng xã hội & Cộng đồng**: Đăng bài viết, thảo luận giải thuật, theo dõi bạn bè, theo dõi Streak học tập hằng ngày.

---

## 🏗️ Kiến trúc Hệ thống (System Architecture)

<p align="center">
  <img src="architect-codexecute.png" alt="System Architecture" />
</p>

---

## ✨ Tính năng chính

### 1. 💻 Trình soạn thảo & Chấm bài (Online Judge)
- **Monaco Editor (IDE tích hợp)**: Auto-complete, syntax highlighting, phím tắt quen thuộc.
- **Chế độ RUN (Đồng bộ)**: Chạy thử bài làm với các testcases mẫu ngay lập tức.
- **Chế độ SUBMIT (Bất đồng bộ)**: Đẩy bài làm vào hàng chờ SQS, worker chấm điểm toàn bộ testcase ẩn và trả kết quả:
  - `Accepted (AC)`
  - `Wrong Answer (WA)`
  - `Time Limit Exceeded (TLE)`
  - `Runtime Error (RTE)`
  - `Compile Error (CE)`

### 2. 🔥 Streak & Thống kê cá nhân
- **Hệ thống Streak**: Theo dõi chuỗi ngày giải bài liên tục để thúc đẩy thói quen học tập.
- **Thống kê trực quan**: Biểu đồ Recharts hiển thị tỉ lệ làm bài thành công, lịch sử bài nộp (Submission History).

### 3. 👥 Cộng đồng & Mạng xã hội
- Bảng tin (Home Feed) chia sẻ bài viết, thủ thuật lập trình.
- Tương tác: Like, Bình luận, Thông báo (Notifications) theo thời gian thực.

### 4. 🔐 Xác thực & Người dùng
- Đăng nhập / Đăng ký qua Email với xác thực mã OTP qua Email (SMTP).
- Đăng nhập nhanh qua **Google OAuth 2.0** và **GitHub OAuth 2.0**.
- Quản lý Hồ sơ cá nhân (User Profile), Avatar tải lên S3.

### 5. 🛠️ Bảng điều khiển Quản trị viên (Admin Panel)
- Quản lý danh sách bài tập (Tạo/Sửa/Xóa).
- Tải lên & quản lý bộ testcase (Input/Output) lưu trữ trên S3 Bucket.

---

## 🛠️ Công nghệ sử dụng

| Tầng | Công nghệ / Thư viện |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS v4, Monaco Editor, Lucide Icons, Radix UI, Recharts |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, Boto3 SDK, PyJWT, Passlib (Bcrypt) |
| **Database & Storage** | AWS DynamoDB (NoSQL), AWS S3 (Media & Testcases) |
| **Message Queue & Serverless** | AWS SQS, AWS Lambda (Container Images) |
| **Sandbox Environment** | Docker (GCC/G++, OpenJDK, Python 3, Node.js) |

---

## 📁 Cấu trúc Dự án

```
CodExecute/
├── fe/                         # 🎨 Frontend Application (React + Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # Components UI (Editor, Submissions, Streak, Auth, Admin)
│   │   │   ├── context/        # React Contexts (Auth, Theme, Notifications)
│   │   │   ├── routes/         # Routing & Page Layouts
│   │   │   └── services/       # API Services (Fetch / Axios wrapper)
│   │   ├── styles/             # Global CSS & Tailwind configuration
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── be/                         # ⚙️ Backend Application (FastAPI & AWS Lambda)
│   ├── app/
│   │   ├── api/v1/             # Endpoints (Auth, Problems, Submissions, Posts, Users)
│   │   ├── core/               # Cấu hình ENV & AWS SDK Clients
│   │   ├── executor/           # Core Sandbox Executor (Local / Container)
│   │   ├── schemas/            # Pydantic Data Models
│   │   └── services/           # DB Service (DynamoDB), SQS Service, S3 Service
│   ├── lambda_api.py           # Entrypoint cho Lambda API Server
│   ├── lambda_worker.py        # Entrypoint cho Lambda SQS Worker Sandbox
│   ├── scripts/                # Scripts khởi tạo DB & Build/Deploy Docker Lambda
│   ├── Dockerfile.lambda       # Dockerfile Sandbox cho Lambda Worker
│   ├── Dockerfile.lambda_api   # Dockerfile Sandbox cho Lambda API
│   ├── docker-compose.yml      # Docker Compose cho môi trường Sandbox local
│   └── requirements.txt
│
└── README.md
```

---

## ⚡ Hướng dẫn Chạy Cục bộ (Local Setup Guide)

### 📋 Yêu cầu tiên quyết
- **Node.js**: `>= 18.0.0`
- **pnpm** hoặc **npm**
- **Python**: `>= 3.12`
- **Docker Desktop** (nếu muốn test Sandbox cục bộ)
- Tài khoản **AWS** (nếu kết nối dịch vụ AWS thật) hoặc chạy với môi trường Dev.

---

### 1. Cấu hình Backend (`be`)

1. Mở terminal và chuyển vào thư mục `be`:
   ```bash
   cd be
   ```

2. Tạo và kích hoạt môi trường ảo Python:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

4. Tạo file cấu hình môi trường `.env` trong thư mục `be/`:
   ```env
   ENVIRONMENT=development
   JWT_SECRET_KEY=your_super_secret_jwt_key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # AWS Credentials & Config
   AWS_REGION=ap-southeast-1
   SQS_QUEUE_URL=https://sqs.ap-southeast-1.amazonaws.com/YOUR_ACCOUNT_ID/codeexecute-submission-queue
   S3_TESTCASE_BUCKET=codeexecute-testcases
   S3_AVATAR_BUCKET=codeexecute-user-media

   # Email OTP (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   EMAILS_FROM_EMAIL=your_email@gmail.com
   ```

5. Khởi tạo các bảng DynamoDB (nếu cần):
   ```bash
   python scripts/create_tables.py
   ```

6. Chạy FastAPI Server ở chế độ phát triển:
   ```bash
   fastapi dev
   ```
   *API Server sẽ hoạt động tại:* `http://127.0.0.1:8000` (Tài liệu OpenAPI Docs tại `http://127.0.0.1:8000/docs`).

---

### 2. Cấu hình Frontend (`fe`)

1. Mở terminal mới và chuyển vào thư mục `fe`:
   ```bash
   cd fe
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   pnpm install
   ```
   *(hoặc `npm install`)*

3. (Tùy chọn) Tạo file `.env` nếu cần chỉ định URL API Server:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. Khởi chạy ứng dụng Frontend:
   ```bash
   pnpm dev
   ```
   *Ứng dụng sẽ chạy tại:* `http://localhost:5173`

---

### 3. Chạy Sandbox Cục bộ bằng Docker Compose (Optional)

Để kiểm thử môi trường Sandbox chấm bài đa ngôn ngữ độc lập ở máy cục bộ:
```bash
cd be
docker compose up --build
```

---

## 🚀 Triển khai (Deployment lên AWS)

Dự án cung cấp sẵn các script tự động hóa việc build Docker Image và Push lên **AWS ECR** để cập nhật **AWS Lambda Functions**:

### 1. Deploy Lambda Worker (`codeexecute-worker`)
- **Windows (PowerShell):**
  ```powershell
  cd be
  .\scripts\build_and_push_lambda.ps1
  ```
- **Linux / macOS:**
  ```bash
  cd be
  chmod +x scripts/build_and_push_lambda.sh
  ./scripts/build_and_push_lambda.sh
  ```

### 2. Deploy Lambda API (`codeexecute-api`)
- **Windows (PowerShell):**
  ```powershell
  cd be
  .\scripts\build_and_push_lambda_api.ps1
  ```
- **Linux / macOS:**
  ```bash
  cd be
  chmod +x scripts/build_and_push_lambda_api.sh
  ./scripts/build_and_push_lambda_api.sh
  ```

---

## 🤝 Đóng góp (Contributing)

Mọi đóng góp nhằm hoàn thiện dự án đều được hoan nghênh! Vui lòng làm theo các bước:
1. Fork dự án
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`)
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên nhánh (`git push origin feature/AmazingFeature`)
5. Mở một **Pull Request**

---


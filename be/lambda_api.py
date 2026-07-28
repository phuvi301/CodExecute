from mangum import Mangum
from app.main import app

# Handler dành cho AWS Lambda (Bọc app bằng handler để Lambda gọi vào)
handler = Mangum(app)
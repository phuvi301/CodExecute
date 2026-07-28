import sys
import uuid
from pathlib import Path
from datetime import datetime

# Đảm bảo UTF-8 encoding cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Thêm thư mục cha (be) vào sys.path để import được module app
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from app.services import auth_service
from app.core import security

ADMIN_EMAIL = "admin@fcaj.com"
ADMIN_PASSWORD = "Admin123!@#"
ADMIN_NAME = "System Administrator"

def seed_admin_user():
    print(f"--- BAT DAU SEED TAI KHOAN ADMIN ({ADMIN_EMAIL}) ---")
    
    existing_user = auth_service.get_user_by_email(ADMIN_EMAIL)
    if existing_user:
        user_id = existing_user["UserID"]
        print(f"[+] Tai khoan Admin da ton tai trong DB (UserID: {user_id}). Tien hanh nang cap Role = admin...")
        hashed_password = security.hash_password(ADMIN_PASSWORD)
        updated = auth_service.update_user(user_id, {
            "Role": "admin",
            "FullName": ADMIN_NAME,
            "PasswordHash": hashed_password
        })
        print(f"[+] Cap nhat thanh cong tai khoan Admin ({updated.get('Email')}) voi Role: {updated.get('Role')}")
    else:
        user_id = str(uuid.uuid4())
        hashed_password = security.hash_password(ADMIN_PASSWORD)
        admin_data = {
            "UserID": user_id,
            "Email": ADMIN_EMAIL,
            "PasswordHash": hashed_password,
            "FullName": ADMIN_NAME,
            "Title": "Lead System Administrator",
            "Address": "Headquarters",
            "Bio": "Tai khoan Quan tri vien he thong CodExecute.",
            "CreatedAt": datetime.utcnow().isoformat(),
            "Role": "admin"
        }
        auth_service.create_user(admin_data)
        print(f"[+] Da tao moi tai khoan Admin thanh cong!")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   Role: admin")

if __name__ == '__main__':
    seed_admin_user()

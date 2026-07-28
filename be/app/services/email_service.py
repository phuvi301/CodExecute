import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)

import os

def send_otp_email(email: str, otp_code: str) -> bool:
    """
    Gửi mã OTP qua Email cho người dùng.
    Nếu SMTP_HOST và SMTP_USER được cấu hình trong .env, sẽ dùng smtplib gửi mail thật.
    Đồng thời luôn log mã OTP ra console để dễ dàng kiểm thử ở môi trường local.
    """
    logger.info(f"========== [EMAIL SERVICE] MÃ OTP CHO {email}: {otp_code} ==========")
    print(f"\n[EMAIL OTP] Email: {email} | Mã OTP: {otp_code}\n")

    smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST")
    smtp_port = settings.SMTP_PORT or int(os.getenv("SMTP_PORT", 587))
    smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER")
    raw_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD")
    smtp_password = raw_password.replace(" ", "") if raw_password else None
    from_email = settings.EMAILS_FROM_EMAIL or os.getenv("EMAILS_FROM_EMAIL", smtp_user)

    if not smtp_host or not smtp_user or not smtp_password:
        logger.info("[EMAIL SERVICE] Chưa cấu hình SMTP_HOST/SMTP_USER/SMTP_PASSWORD. Bỏ qua gửi email qua SMTP (dùng OTP trên console log).")
        return True


    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{settings.PROJECT_NAME}] Mã xác thực email của bạn: {otp_code}"
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = email

        text_content = f"Mã xác thực CodExecute của bạn là: {otp_code}. Mã này có hiệu lực trong 5 phút."
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }}
            .container {{ max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
            .header {{ text-align: center; border-bottom: 1px solid #eef2f6; padding-bottom: 20px; }}
            .brand {{ font-size: 24px; font-weight: bold; color: #1e293b; }}
            .brand-accent {{ color: #4f46e5; }}
            .content {{ padding: 24px 0; text-align: center; }}
            .otp-box {{ background: #f1f5f9; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; padding: 16px 24px; display: inline-block; margin: 20px 0; border: 1px dashed #cbd5e1; }}
            .footer {{ text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eef2f6; padding-top: 20px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">Cod<span class="brand-accent">Execute</span></div>
            </div>
            <div class="content">
              <h2>Xác thực địa chỉ Email</h2>
              <p style="color: #475569; font-size: 15px;">Dùng mã OTP dưới đây để hoàn tất xác thực tài khoản của bạn. Mã có hiệu lực trong <strong>5 phút</strong>.</p>
              <div class="otp-box">{otp_code}</div>
              <p style="color: #64748b; font-size: 13px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              &copy; CodExecute - Nền tảng luyện tập & chia sẻ lập trình.
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        if settings.SMTP_TLS:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_email or smtp_user, [email], msg.as_string())
        server.quit()


        logger.info(f"[EMAIL SERVICE] Đã gửi OTP tới email {email} qua SMTP thành công.")
        return True
    except Exception as e:
        logger.error(f"[EMAIL SERVICE] Lỗi gửi email qua SMTP: {str(e)}")
        # Trả về True trong dev mode để không làm đứt mạch ứng dụng nếu SMTP bị chặn/lỗi mạng
        return True

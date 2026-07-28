import json
import logging
from app.core.aws import sqs_client
from app.core.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def push_submission_to_queue(submission_id: str, user_id: str, problem_id: str, language: str, code: str):
    """
    Đẩy payload code của user vào Amazon SQS Queue để Lambda Worker nhận và xử lý.
    """
    logger.info(f"🚀 [SQS Service] Bắt đầu xử lý push_submission_to_queue cho submission_id: {submission_id}")

    message_body = {
        "submission_id": submission_id,
        "user_id": user_id,
        "problem_id": problem_id,
        "language": language,
        "code": code
    }

    queue_url = settings.SQS_QUEUE_URL
    if not queue_url:
        logger.warning("SQS_QUEUE_URL chưa được cấu hình. Bỏ qua push message SQS.")
        return None

    # Ở môi trường local development, ưu tiên dùng local BackgroundTasks để chấm bài tức thì
    if settings.ENVIRONMENT == "development":
        logger.info(f"💡 [Development Mode] Bỏ qua SQS Queue, sử dụng local BackgroundTasks để chấm bài tức thì cho {submission_id}")
        return None

    try:
        logger.info(f"📡 Đang gửi message đến AWS SQS Queue...")
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body)
        )
        logger.info(f"✅ Đã gửi submission {submission_id} vào SQS Queue thành công.\nMessageId: {response.get('MessageId')}")
        return response.get('MessageId')
    except Exception as e:
        logger.error(f"❌ Lỗi khi gửi message vào SQS (tự động chuyển sang fallback chấm ngầm local): {e}")
        return None


import json
import logging
from app.core.aws import sqs_client
from app.core.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def push_submission_to_queue(submission_id: str, user_id: str, problem_id: str, language: str, code: str):
    """
    Pushes user submission code payload to Amazon SQS Queue for Lambda Worker execution.
    """
    logger.info(f"[SQS Service] Starting push_submission_to_queue for submission_id: {submission_id}")

    message_body = {
        "submission_id": submission_id,
        "user_id": user_id,
        "problem_id": problem_id,
        "language": language,
        "code": code
    }

    queue_url = settings.SQS_QUEUE_URL
    if not queue_url:
        logger.warning("SQS_QUEUE_URL is not configured. Skipping SQS message push.")
        return None

    try:
        logger.info(f"Sending message to AWS SQS Queue...")
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body)
        )
        logger.info(f"Successfully pushed submission {submission_id} to SQS Queue. MessageId: {response.get('MessageId')}")
        return response.get('MessageId')
    except Exception as e:
        logger.error(f"Error sending message to SQS (falling back to local background execution): {e}")
        return None


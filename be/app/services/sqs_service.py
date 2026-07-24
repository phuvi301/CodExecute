import json
from app.core.aws import sqs_client
from app.core.config import settings

def push_submission_to_queue(submission_id: str, problem_id: str, language: str, code: str):
    """Đẩy job chấm bài vào SQS Queue"""
    message_body = {
        "submission_id": submission_id,
        "problem_id": problem_id,
        "language": language,
        "code": code
    }

    response = sqs_client.send_message(
        QueueUrl=settings.SQS_SUBMISSION_QUEUE_URL,
        MessageBody=json.dumps(message_body)
    )
    return response.get('MessageId')
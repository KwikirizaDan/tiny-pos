import httpx

from app.celery_app import celery
from app.config import settings

EGOSMS_URL = "https://www.egosms.co/api/v1/plain/"
SUCCESS_CODE = "1701"


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_sms(self, recipient: str, message: str):
    """Send a single SMS via EgoSMS. recipient should be in international format e.g. 256700000000."""
    payload = {
        "Number": recipient,
        "Message": message,
        "SenderName": settings.egosms_sender_id,
        "Username": settings.egosms_username,
        "Password": settings.egosms_password,
    }

    try:
        with httpx.Client(timeout=20) as client:
            resp = client.post(EGOSMS_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()
        # EgoSMS returns a list of status objects, one per recipient
        statuses = data if isinstance(data, list) else [data]
        for status in statuses:
            code = str(status.get("code", status.get("Code", "")))
            if code != SUCCESS_CODE:
                raise Exception(f"EgoSMS rejected message: {status}")
    except Exception as exc:
        raise self.retry(exc=exc)

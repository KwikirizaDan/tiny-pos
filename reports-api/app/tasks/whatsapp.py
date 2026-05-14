import httpx

from app.celery_app import celery
from app.config import settings


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_whatsapp(self, recipient: str, pdf_url: str, vendor_name: str):
    url = f"{settings.green_api_base}/sendFileByUrl"

    payload = {
        "chatId": f"{recipient}@c.us",
        "urlFile": pdf_url,
        "fileName": f"{vendor_name}-daily-report.pdf",
        "caption": f"{vendor_name} — Daily Sales Report ({__import__('datetime').date.today().isoformat()})",
    }

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.green_api_token}",
                "Content-Type": "application/json",
            },
        )

    if resp.status_code != 200:
        raise self.retry(exc=Exception(f"Green API error: {resp.text}"))

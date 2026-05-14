from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery = Celery(
    "tinypos-reports",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Kampala",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery.conf.beat_schedule = {
    "daily-report": {
        "task": "app.tasks.report.generate_and_send",
        "schedule": crontab(hour=21, minute=0),
    },
    "low-stock-check": {
        "task": "app.tasks.low_stock.check_low_stock",
        # Runs every hour so alerts fire promptly after a sale or stock adjustment
        "schedule": crontab(minute=0),
    },
}

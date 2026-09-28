from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "crm",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.task_routes = {
    "app.workers.tasks.outbox_publisher.*": {"queue": "default"},
    "app.workers.tasks.event_consumer.*": {"queue": "default"},
    "app.workers.tasks.workflow_scheduler.*": {"queue": "default"},
    "app.workers.tasks.communication_sender.*": {"queue": "communication"},
}

celery_app.conf.beat_schedule = {
    "consume-outbox-every-5s": {
        "task": "app.workers.tasks.event_consumer.consume_pending",
        "schedule": 5.0,
    },
    "send-communications-every-10s": {
        "task": "app.workers.tasks.communication_sender.send_pending",
        "schedule": 10.0,
    },
    "run-scheduled-workflows-hourly": {
        "task": "app.workers.tasks.workflow_scheduler.run_scheduled",
        "schedule": crontab(minute=0),
    },
}
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Mock heavy/non-installed modules before any app imports
sys.modules["supabase"] = MagicMock()
sys.modules["jinja2"] = MagicMock()

weasyprint_mock = MagicMock()
weasyprint_mock.HTML = MagicMock()
sys.modules["weasyprint"] = weasyprint_mock

# Remove any cached app modules from previous runs
for mod in list(sys.modules.keys()):
    if mod.startswith("app"):
        del sys.modules[mod]

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("GREEN_API_INSTANCE_ID", "12345")
os.environ.setdefault("GREEN_API_TOKEN", "test-token")
os.environ.setdefault("GREEN_API_PHONE", "256700000000")
os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CORS_ORIGIN", "http://localhost:3000")


@pytest.fixture
def client():
    with patch("app.celery_app.celery") as mock_celery:
        mock_celery.send_task = MagicMock()
        mock_celery.AsyncResult = MagicMock()
        from app.main import app
        from fastapi.testclient import TestClient

        with TestClient(app) as c:
            yield c


@pytest.fixture
def api_key_header():
    return {"X-API-Key": "test-api-key"}

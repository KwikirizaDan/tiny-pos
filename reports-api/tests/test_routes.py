from unittest.mock import patch, MagicMock


class TestHealth:
    def test_health_without_auth_returns_422(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 422

    def test_health_with_auth(self, client, api_key_header):
        resp = client.get("/api/v1/health", headers=api_key_header)
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestTriggerReport:
    ENDPOINT = "/api/v1/trigger-report"

    def test_missing_header_returns_422(self, client):
        resp = client.post(self.ENDPOINT)
        assert resp.status_code == 422

    def test_wrong_api_key(self, client):
        resp = client.post(self.ENDPOINT, headers={"X-API-Key": "wrong-key"})
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid API key"

    def test_triggers_task(self, client, api_key_header):
        fake_task = MagicMock()
        fake_task.id = "mock-task-id-123"

        with patch("app.tasks.report.generate_and_send.delay", return_value=fake_task):
            resp = client.post(self.ENDPOINT, headers=api_key_header)

        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "mock-task-id-123"
        assert "queued" in data["message"].lower()


class TestTaskStatus:
    ENDPOINT = "/api/v1/tasks/"

    def test_missing_header_returns_422(self, client):
        resp = client.get(self.ENDPOINT + "some-id")
        assert resp.status_code == 422

    def test_wrong_api_key(self, client):
        resp = client.get(self.ENDPOINT + "task-1", headers={"X-API-Key": "wrong"})
        assert resp.status_code == 401

    def test_pending_task(self, client, api_key_header):
        mock_async = MagicMock()
        mock_async.failed.return_value = False
        mock_async.state = "PENDING"
        mock_async.ready.return_value = False

        with patch("app.routes.AsyncResult", return_value=mock_async):
            resp = client.get(self.ENDPOINT + "task-1", headers=api_key_header)

        assert resp.status_code == 200
        assert resp.json() == {"task_id": "task-1", "status": "PENDING", "result": None}

    def test_successful_task(self, client, api_key_header):
        mock_async = MagicMock()
        mock_async.failed.return_value = False
        mock_async.state = "SUCCESS"
        mock_async.ready.return_value = True
        mock_async.result = {"report_url": "https://example.com/report.pdf"}

        with patch("app.routes.AsyncResult", return_value=mock_async):
            resp = client.get(self.ENDPOINT + "task-2", headers=api_key_header)

        assert resp.status_code == 200
        assert resp.json() == {
            "task_id": "task-2",
            "status": "SUCCESS",
            "result": {"report_url": "https://example.com/report.pdf"},
        }

    def test_failed_task(self, client, api_key_header):
        mock_async = MagicMock()
        mock_async.failed.return_value = True
        mock_async.state = "FAILURE"
        mock_async.result = Exception("Something went wrong")
        mock_async.ready.return_value = True

        with patch("app.routes.AsyncResult", return_value=mock_async):
            resp = client.get(self.ENDPOINT + "task-3", headers=api_key_header)

        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "task-3"
        assert data["status"] == "FAILURE"
        assert "error" in data["result"]

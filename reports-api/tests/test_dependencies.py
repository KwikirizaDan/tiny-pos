from unittest.mock import patch, MagicMock


class TestVerifyApiKey:
    ENDPOINT = "/api/v1/trigger-report"

    def test_missing_header_returns_422(self, client):
        resp = client.post(self.ENDPOINT)
        assert resp.status_code == 422

    def test_invalid_key_returns_401(self, client):
        resp = client.post(self.ENDPOINT, headers={"X-API-Key": "wrong"})
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid API key"

    def test_valid_key_returns_200(self, client, api_key_header):
        fake_task = MagicMock()
        fake_task.id = "test-id"

        with patch("app.tasks.report.generate_and_send.delay", return_value=fake_task):
            resp = client.post(self.ENDPOINT, headers=api_key_header)

        assert resp.status_code == 200

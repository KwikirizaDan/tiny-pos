from unittest.mock import patch, MagicMock


class TestGetSupabase:
    def test_creates_client_on_first_call(self):
        from app.supabase_client import get_supabase, _supabase

        _supabase = None

        fake_client = MagicMock()

        with patch("app.supabase_client._supabase", None):
            with patch("app.supabase_client.create_client", return_value=fake_client) as mock_create:
                client = get_supabase()

        assert client is fake_client
        mock_create.assert_called_once_with(
            "https://test.supabase.co",
            "test-service-key",
        )

    def test_returns_same_client_on_subsequent_calls(self):
        from app.supabase_client import get_supabase

        fake_client = MagicMock()

        with patch("app.supabase_client._supabase", None):
            with patch("app.supabase_client.create_client", return_value=fake_client):
                first = get_supabase()
                second = get_supabase()

        assert first is second

    def test_returns_existing_client_without_calling_create(self):
        from app.supabase_client import get_supabase

        fake_client = MagicMock()

        with patch("app.supabase_client._supabase", fake_client):
            with patch("app.supabase_client.create_client") as mock_create:
                client = get_supabase()

        assert client is fake_client
        mock_create.assert_not_called()

import os


class TestSettings:
    def test_settings_load_from_env(self):
        from app.config import settings
        assert settings.supabase_url == "https://test.supabase.co"
        assert settings.supabase_service_key == "test-service-key"
        assert settings.api_key == "test-api-key"
        assert settings.cors_origin == "http://localhost:3000"
        assert settings.redis_url == "redis://localhost:6379/0"
        assert settings.green_api_base.startswith("https://api.green-api.com")

    def test_green_api_base_format(self):
        from app.config import settings
        expected = "https://api.green-api.com/waInstance12345"
        assert settings.green_api_base == expected

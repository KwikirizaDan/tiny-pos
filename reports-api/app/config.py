from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    green_api_instance_id: str
    green_api_token: str
    green_api_phone: str
    api_key: str
    redis_url: str = "redis://redis:6379/0"
    cors_origin: str = "http://localhost:3000"

    # EgoSMS credentials
    egosms_username: str
    egosms_password: str
    egosms_sender_id: str = "TinyPOS"

    @property
    def green_api_base(self) -> str:
        return f"https://api.green-api.com/waInstance{self.green_api_instance_id}"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

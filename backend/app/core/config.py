from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    supabase_url: str = ""
    supabase_key: str = ""
    database_url: str = ""
    osrm_base_url: str = "https://router.project-osrm.org"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

settings = Settings()

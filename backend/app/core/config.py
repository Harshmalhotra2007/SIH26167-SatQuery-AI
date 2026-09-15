import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SatQuery AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    USE_LOCAL_FALLBACK: bool = True
    MAX_QUESTION_LENGTH: int = 500
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./tmp_uploads")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,https://*.vercel.app")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

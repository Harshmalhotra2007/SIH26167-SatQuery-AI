import os
import tempfile
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SatQuery AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    USE_LOCAL_FALLBACK: bool = True
    MAX_QUESTION_LENGTH: int = 500
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,https://*.vercel.app")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

def get_upload_dir() -> Path:
    env_dir = os.getenv("UPLOAD_DIR")
    if env_dir:
        p = Path(env_dir)
    else:
        p = Path("./tmp_uploads")
    try:
        p.mkdir(parents=True, exist_ok=True)
        return p
    except OSError:
        p = Path(tempfile.gettempdir()) / "tmp_uploads"
        p.mkdir(parents=True, exist_ok=True)
        return p

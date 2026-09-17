from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    analyzer: str = "mock"
    """One of: mock, openai, qwen, local."""

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    qwen_api_key: str = ""
    qwen_base_url: str = ""
    qwen_model: str = "qwen2.5-vl-7b-instruct"

    max_image_edge: int = 512
    """Photos are downscaled to this longest edge before upload to keep token cost low."""

    database_path: Path = BASE_DIR / "snapcal.db"
    media_dir: Path = BASE_DIR / "media"
    cache_dir: Path = BASE_DIR / "cache"


settings = Settings()

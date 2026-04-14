from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "sandbox-orchestrator"
    upload_dir: str = "uploads"
    k8s_namespace: str = "default"
    sandbox_image: str = "sandbox-image:latest"
    backend_base_url: str = "http://backend-service.default.svc.cluster.local:8000"
    use_in_cluster_config: bool = False
    enable_mock_sandbox: bool = True

    model_config = SettingsConfigDict(env_prefix="APP_", extra="ignore")

    @property
    def upload_path(self) -> Path:
        return Path(__file__).resolve().parents[2] / self.upload_dir


@lru_cache
def get_settings() -> Settings:
    return Settings()

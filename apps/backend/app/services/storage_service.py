from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()


def ensure_upload_dir() -> Path:
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    return settings.upload_path


async def save_upload(job_id: str, file: UploadFile) -> Path:
    upload_dir = ensure_upload_dir() / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = Path(file.filename or "uploaded.bin").name
    destination = upload_dir / filename

    content = await file.read()
    destination.write_bytes(content)

    return destination

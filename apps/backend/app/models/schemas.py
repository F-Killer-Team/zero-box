from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from app.models.job import JobStatus


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EventResponse(BaseModel):
    status: JobStatus
    message: str
    progress: int = Field(ge=0, le=100)
    timestamp: datetime = Field(default_factory=utcnow)


class JobResponse(BaseModel):
    job_id: str
    filename: str
    status: JobStatus
    sandbox_job_name: str | None = None
    result: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class UploadResponse(BaseModel):
    job_id: str
    status: JobStatus


class SandboxResultRequest(BaseModel):
    status: JobStatus
    summary: str
    log_excerpt: str | None = None

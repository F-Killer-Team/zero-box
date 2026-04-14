import asyncio
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings
from app.db.memory import JOBS
from app.models.job import JobStatus
from app.models.schemas import JobResponse, SandboxResultRequest, UploadResponse
from app.services.event_service import add_event
from app.services.kubernetes_service import create_sandbox_job
from app.services.storage_service import save_upload
from app.utils.ids import generate_job_id

settings = get_settings()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_job(job_id: str) -> JobResponse | None:
    return JOBS.get(job_id)


def _update_status(job: JobResponse, status: JobStatus) -> JobResponse:
    job.status = status
    job.updated_at = _utcnow()
    JOBS[job.job_id] = job
    return job


def update_job_status(job_id: str, status: JobStatus, sandbox_job_name: str | None = None) -> JobResponse:
    job = JOBS[job_id]
    if sandbox_job_name is not None:
        job.sandbox_job_name = sandbox_job_name
    return _update_status(job, status)


async def create_job(file: UploadFile) -> UploadResponse:
    job_id = generate_job_id()
    saved_path = await save_upload(job_id, file)
    filename = Path(saved_path).name
    now = _utcnow()

    job = JobResponse(
        job_id=job_id,
        filename=filename,
        status=JobStatus.UPLOADED,
        created_at=now,
        updated_at=now,
    )
    JOBS[job_id] = job

    add_event(job_id, JobStatus.UPLOADED, "File upload completed.", 10)
    update_job_status(job_id, JobStatus.POD_REQUESTED)
    add_event(job_id, JobStatus.POD_REQUESTED, "Requesting security sandbox provisioning...", 20)

    sandbox_job = create_sandbox_job(job_id, filename)
    if sandbox_job["submitted"]:
        update_job_status(job_id, JobStatus.POD_RUNNING, sandbox_job_name=str(sandbox_job["job_name"]))
        add_event(job_id, JobStatus.POD_RUNNING, f"Sandbox created successfully (ID: {sandbox_job['job_name']}).", 35)
        update_job_status(job_id, JobStatus.ANALYZING)
        add_event(job_id, JobStatus.ANALYZING, "Running file execution and behavioral analysis...", 60)
    elif settings.enable_mock_sandbox:
        add_event(job_id, JobStatus.POD_REQUESTED, "Cluster submission skipped. Starting mock sandbox flow...", 25)
        from app.services.mock_sandbox_service import simulate_sandbox_run

        asyncio.create_task(simulate_sandbox_run(job_id, filename))

    return UploadResponse(job_id=job_id, status=job.status)


def complete_job(job_id: str, payload: SandboxResultRequest) -> JobResponse:
    job = JOBS[job_id]

    result = {
        "summary": payload.summary,
        "log_excerpt": payload.log_excerpt,
    }
    job.result = result

    if payload.status == JobStatus.MALICIOUS:
        _update_status(job, JobStatus.MALICIOUS)
        add_event(job_id, JobStatus.MALICIOUS, "Critical malware behavior detected. Encryption attempt was blocked.", 80)
    elif payload.status == JobStatus.CLEAN:
        _update_status(job, JobStatus.CLEAN)
        add_event(job_id, JobStatus.CLEAN, "No suspicious behavior was detected.", 80)
    else:
        _update_status(job, JobStatus.FAILED)
        add_event(job_id, JobStatus.FAILED, "The sandbox returned an unexpected status.", 80)

    _update_status(job, JobStatus.TERMINATING)
    add_event(job_id, JobStatus.TERMINATING, "Destroying sandbox resources immediately...", 90)

    _update_status(job, JobStatus.DESTROYED)
    add_event(job_id, JobStatus.DESTROYED, "Sandbox cleanup finished. Your infrastructure remains safe.", 100)

    return job

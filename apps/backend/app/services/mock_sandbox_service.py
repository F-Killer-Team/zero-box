import asyncio

from app.models.job import JobStatus
from app.models.schemas import SandboxResultRequest
from app.services.event_service import add_event
from app.services.job_service import complete_job, get_job, update_job_status


async def simulate_sandbox_run(job_id: str, filename: str) -> None:
    job = get_job(job_id)
    if job is None:
        return

    update_job_status(job_id, JobStatus.POD_RUNNING, sandbox_job_name=f"sandbox-job-{job_id}")
    add_event(job_id, JobStatus.POD_RUNNING, f"Sandbox created successfully (ID: sandbox-job-{job_id}).", 35)

    await asyncio.sleep(1.0)

    update_job_status(job_id, JobStatus.ANALYZING)
    add_event(job_id, JobStatus.ANALYZING, "Running file execution and behavioral analysis...", 60)

    await asyncio.sleep(1.5)

    lowered = filename.lower()
    is_malicious = any(token in lowered for token in ("virus", "malware", "ransom", "hack", "exe"))
    payload = SandboxResultRequest(
        status=JobStatus.MALICIOUS if is_malicious else JobStatus.CLEAN,
        summary="Mock sandbox detected a ransomware signature."
        if is_malicious
        else "Mock sandbox found no suspicious behavior.",
        log_excerpt="[FATAL ERROR] HACKED!! Encrypting files..." if is_malicious else "[INFO] Scan completed without suspicious output.",
    )
    complete_job(job_id, payload)

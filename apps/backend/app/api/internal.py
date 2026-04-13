from fastapi import APIRouter, HTTPException

from app.models.schemas import JobResponse, SandboxResultRequest
from app.services.job_service import complete_job, get_job

router = APIRouter(tags=["internal"])


@router.post("/internal/jobs/{job_id}/result", response_model=JobResponse)
def receive_result(job_id: str, payload: SandboxResultRequest) -> JobResponse:
    if get_job(job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return complete_job(job_id, payload)

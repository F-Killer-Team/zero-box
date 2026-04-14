from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import JobResponse, SandboxResultRequest
from app.services.job_service import complete_job, get_job
from app.services.storage_service import get_saved_upload

router = APIRouter(tags=["internal"])


@router.post("/internal/jobs/{job_id}/result", response_model=JobResponse)
def receive_result(job_id: str, payload: SandboxResultRequest) -> JobResponse:
    if get_job(job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return complete_job(job_id, payload)


@router.get("/internal/jobs/{job_id}/file")
def download_uploaded_file(job_id: str) -> FileResponse:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    saved_file = get_saved_upload(job_id)
    if saved_file is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    return FileResponse(path=saved_file, filename=job.filename)

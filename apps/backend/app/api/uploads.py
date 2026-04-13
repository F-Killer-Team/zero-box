from fastapi import APIRouter, File, UploadFile

from app.models.schemas import UploadResponse
from app.services.job_service import create_job

router = APIRouter(tags=["uploads"])


@router.post("/uploads", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename:
        file.filename = "uploaded.bin"
    return await create_job(file)

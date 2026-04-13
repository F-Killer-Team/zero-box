from app.models.schemas import EventResponse, JobResponse

JOBS: dict[str, JobResponse] = {}
EVENTS: dict[str, list[EventResponse]] = {}

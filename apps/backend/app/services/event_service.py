from app.db.memory import EVENTS
from app.models.job import JobStatus
from app.models.schemas import EventResponse


def add_event(job_id: str, status: JobStatus, message: str, progress: int) -> EventResponse:
    event = EventResponse(status=status, message=message, progress=progress)
    EVENTS.setdefault(job_id, []).append(event)
    return event


def get_events(job_id: str) -> list[EventResponse]:
    return EVENTS.get(job_id, [])

from uuid import uuid4


def generate_job_id() -> str:
    return f"job-{uuid4().hex[:8]}"

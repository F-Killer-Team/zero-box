from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthz() -> None:
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_flow_exposes_job_and_events() -> None:
    upload_response = client.post(
        "/api/uploads",
        files={"file": ("invoice.exe", BytesIO(b"fake payload"), "application/octet-stream")},
    )

    assert upload_response.status_code == 200
    payload = upload_response.json()
    assert payload["job_id"].startswith("job-")
    assert payload["status"] in {"POD_REQUESTED", "POD_RUNNING", "ANALYZING"}

    job_id = payload["job_id"]

    job_response = client.get(f"/api/jobs/{job_id}")
    assert job_response.status_code == 200
    job_payload = job_response.json()
    assert job_payload["filename"] == "invoice.exe"

    with client.stream("GET", f"/api/jobs/{job_id}/events") as stream_response:
        assert stream_response.status_code == 200
        chunks = []
        for chunk in stream_response.iter_text():
            if chunk:
                chunks.append(chunk)
            if any("data:" in part for part in chunks):
                break

    combined = "".join(chunks)
    assert "data:" in combined
    assert "Requesting security sandbox provisioning" in combined

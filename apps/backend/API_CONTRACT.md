# Backend API Contract

This document is the handoff contract for the frontend team and the sandbox-core team.

## Frontend flow

1. Upload a file with `POST /api/uploads`.
2. Read `job_id` from the response.
3. Open `GET /api/jobs/{job_id}/events` with `EventSource`.
4. Optionally poll `GET /api/jobs/{job_id}` for the final state card.

## `POST /api/uploads`

Accepts a multipart file upload and starts a sandbox analysis job.

Example response:

```json
{
  "job_id": "job-3a1b92ef",
  "status": "POD_REQUESTED"
}
```

## `GET /api/jobs/{job_id}`

Returns the current job status and final result when available.

Example response:

```json
{
  "job_id": "job-3a1b92ef",
  "filename": "invoice.exe",
  "status": "DESTROYED",
  "sandbox_job_name": "sandbox-job-job-3a1b92ef",
  "result": {
    "summary": "Critical malware behavior detected.",
    "log_excerpt": "[FATAL ERROR] HACKED!! Encrypting files..."
  },
  "created_at": "2026-04-13T06:11:00.000000Z",
  "updated_at": "2026-04-13T06:11:04.000000Z"
}
```

## `GET /api/jobs/{job_id}/events`

Streams server-sent events. Each `data:` payload follows this shape:

```json
{
  "status": "POD_RUNNING",
  "message": "Sandbox created successfully (ID: sandbox-job-job-3a1b92ef).",
  "progress": 35,
  "timestamp": "2026-04-13T06:11:01.000000Z"
}
```

The frontend should render these messages in order as the live console / progress timeline.

## `POST /api/internal/jobs/{job_id}/result`

This callback is owned by the sandbox-core team. Call it once analysis is complete.

Request body:

```json
{
  "status": "MALICIOUS",
  "summary": "HACKED signature detected in runtime logs.",
  "log_excerpt": "[FATAL ERROR] HACKED!! Encrypting files..."
}
```

Accepted `status` values for the callback:

- `MALICIOUS`
- `CLEAN`

## Recommended frontend labels

- `UPLOADED`: File upload completed.
- `POD_REQUESTED`: Requesting security sandbox provisioning...
- `POD_RUNNING`: Sandbox created successfully.
- `ANALYZING`: Running file execution and behavioral analysis...
- `MALICIOUS`: Critical malware behavior detected.
- `CLEAN`: No suspicious behavior was detected.
- `TERMINATING`: Destroying sandbox resources immediately...
- `DESTROYED`: Sandbox cleanup finished. Your infrastructure remains safe.

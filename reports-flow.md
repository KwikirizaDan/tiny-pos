# Daily Report Flow

```
 21:00
   │
 Celery Beat                          (scheduler fires)
   │
   ▼
 generate_and_send                    (Celery task)
   │
   ├─ 1. Query Supabase for all vendors
   │
   ├─ 2. For each vendor:
   │     │
   │     ├─ Fetch today's sales from Supabase
   │     │     SELECT * FROM sales
   │     │     WHERE vendor_id = ?
   │     │       AND created_at >= today
   │     │
   │     ├─ Render HTML from Jinja2 template
   │     │
   │     ├─ Convert HTML → PDF via WeasyPrint
   │     │
   │     └─ Upload PDF to Supabase Storage
   │           bucket: reports/
   │           path:   reports/{vendor_id}/{date}.pdf
   │
   └─ 3. Dispatch send_whatsapp task per vendor
               │
               ▼
         send_whatsapp                 (Celery task)
               │
               ├─ Build Green API payload:
               │     POST /waInstance{id}/sendFileByUrl
               │     {
               │       "chatId": "256707265240@c.us",
               │       "urlFile": "<supabase public URL>",
               │       "fileName": "StoreName-2026-05-12.pdf",
               │       "caption": "StoreName — Daily Sales Report"
               │     }
               │
               └─ Green API delivers PDF to WhatsApp
```

## Manual trigger

```bash
curl -X POST http://localhost:8000/api/v1/trigger-report \
  -H "X-API-Key: your-secret-key"
```

Response:

```json
{"task_id": "uuid", "message": "Report generation queued"}
```

Check status:

```bash
curl http://localhost:8000/api/v1/tasks/{task_id} \
  -H "X-API-Key: your-secret-key"
```

```json
{"task_id": "uuid", "status": "SUCCESS", "result": null}
```

## Directory layout

```
reports-api/
├── app/
│   ├── main.py            # FastAPI entry — CORS, error handler, routes
│   ├── config.py          # Pydantic Settings — all env vars validated at boot
│   ├── dependencies.py    # X-API-Key guard
│   ├── supabase_client.py # Singleton Supabase client (service_role key)
│   ├── celery_app.py      # Celery app + beat schedule (21:00 daily)
│   ├── routes.py          # POST /trigger-report, GET /tasks/{id}, GET /health
│   └── tasks/
│       ├── report.py      # generate_and_send — fetch sales, build PDF, upload
│       └── whatsapp.py    # send_whatsapp — Green API HTTP call
├── Dockerfile
├── .env.example
└── requirements.txt
```

## Data flow

| Step | Component | Action |
|------|-----------|--------|
| 1 | Celery Beat | Fires `generate_and_send` at 21:00 daily |
| 2 | Celery Worker | Picks up task from Redis queue |
| 3 | Supabase | Queries all vendors + today's sales |
| 4 | Jinja2 | Renders HTML report template |
| 5 | WeasyPrint | Converts HTML → PDF in-memory |
| 6 | Supabase Storage | Uploads PDF to `reports/{vendor_id}/{date}.pdf` |
| 7 | Celery (subtask) | Dispatches `send_whatsapp` per vendor |
| 8 | Green API | Receives PDF URL, delivers to WhatsApp |
| 9 | WhatsApp | User receives the PDF report |

## Error handling

| Failure | Behavior |
|---------|----------|
| Supabase query fails | Task retries 3x with 5min delay |
| PDF generation fails | Task retries 3x with 5min delay |
| Storage upload fails | Task retries 3x with 5min delay |
| Green API returns non-200 | Sub-task retries 3x with 1min delay |
| All retries exhausted | Task marked FAILURE in Celery, logged |

## Infrastructure

```
                    docker-compose.yml
    ┌──────────────────────────────────────────┐
    │                                          │
    │  ┌──────────┐                            │
    │  │  Redis   │ ◄── broker + result backend │
    │  └────┬─────┘                            │
    │       │                                  │
    │  ┌────┴─────────────────────┐            │
    │  │  Celery Beat (scheduler) │ 21:00 cron │
    │  └──────────────────────────┘            │
    │       │                                  │
    │  ┌────┴─────────────────────┐            │
    │  │  Celery Worker           │            │
    │  │  ├─ generate_and_send   │            │
    │  │  └─ send_whatsapp       │            │
    │  └────┬─────────────────────┘            │
    │       │                                  │
    │  ┌────┴──────────┐  ┌───────────────┐    │
    │  │   FastAPI     │  │   Supabase    │    │
    │  │  (manual      │  │  (shared DB   │    │
    │  │   trigger)    │  │   + Storage)  │    │
    │  └───────────────┘  └───────────────┘    │
    │                              │           │
    │                     ┌────────┴────────┐  │
    │                     │   Green API     │  │
    │                     └────────┬────────┘  │
    │                              │           │
    │                          WhatsApp        │
    └──────────────────────────────────────────┘
```

## Env vars required

| Variable | Where from |
|----------|-----------|
| `SUPABASE_URL` | Supabase project settings |
| `SUPABASE_SERVICE_KEY` | Supabase SQL editor → `select current_setting('supabase.service_role_key')` or project settings → API → `service_role` key |
| `GREEN_API_INSTANCE_ID` | Green API dashboard → instance settings |
| `GREEN_API_TOKEN` | Green API dashboard → instance settings |
| `GREEN_API_PHONE` | Your WhatsApp number (international format, no `+`) |
| `API_KEY` | Generate: `openssl rand -hex 32` |
| `REDIS_URL` | Default `redis://redis:6379/0` |
| `CORS_ORIGIN` | Your Next.js URL (default `http://localhost:3000`) |

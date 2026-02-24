# SkyDesk360 Backend

FastAPI backend for SkyDesk360 coworking booking and admin APIs.

## Environment

Create `Backend/.env` from `Backend/.env.example`.

Important production settings:
- `ENVIRONMENT=production`
- strong `SECRET_KEY` (minimum 32 characters)
- explicit `CORS_ORIGINS` (no `*`)

## Run (Local)

```bash
.\venv\Scripts\uvicorn main:app --reload
```

## Run (Docker)

```bash
docker build -t skydesk-backend ./Backend
docker run --rm -p 8000:8000 --env-file ./Backend/.env skydesk-backend
```

## API Areas

- `POST /auth/register`
- `POST /auth/login`
- `GET /seats`, `GET /seats/available`
- `POST /bookings/create/{seat_id}`
- `POST /bookings/process-payment/{booking_id}`
- `GET /admin/users`, `GET /admin/bookings`, `GET /admin/stats`

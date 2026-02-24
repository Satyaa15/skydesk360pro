# Railway Docker Deployment Guide (SkyDesk360)

Deploy as two Railway services from the same repo, each with its own root directory and Dockerfile.

## Local Docker Test First

From repo root:

```bash
docker compose up --build
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Railway Deployment (Docker)

## 1. Backend Service

1. Create a Railway service from your repo.
2. Set **Root Directory** to `Backend`.
3. Railway will detect `Backend/Dockerfile` and build it.
4. Add PostgreSQL service/plugin and link it.
5. Set env vars:

- `ENVIRONMENT=production`
- `SECRET_KEY=<strong-random-32+-chars>`
- `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- `CORS_ORIGINS=https://<frontend-domain>.up.railway.app`
- `DATABASE_URL` from Railway Postgres

6. Deploy and copy the backend public URL.

## 2. Frontend Service

1. Create another Railway service from the same repo.
2. Set **Root Directory** to `Frontend`.
3. Add a **build variable**:

- `VITE_API_BASE_URL=https://<backend-domain>.up.railway.app`

4. Railway will build from `Frontend/Dockerfile`.
5. Deploy frontend.

## 3. Final Verification

- Open frontend domain.
- Register/login.
- Verify backend logs for API requests.
- If frontend domain changes, update backend `CORS_ORIGINS`.

## Notes

- Backend listens on `PORT` automatically in Docker command.
- Frontend is served as static build via `serve` in container.
- `Backend/app/core/config.py` handles `postgres://` -> `postgresql://` conversion.

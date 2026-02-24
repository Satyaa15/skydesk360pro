# Render Deployment Guide (SkyDesk360)

This project is already Dockerized for both services.
Deploy as 3 Render resources:
- PostgreSQL database
- Backend web service (Docker)
- Frontend web service (Docker)

## 1. Push Code to GitHub
Render deploys from a Git repository.

## 2. Create PostgreSQL on Render
1. Render Dashboard -> New -> PostgreSQL.
2. Name: `skydesk360-db`.
3. Plan: your choice.
4. After creation, copy the `External Database URL`.

## 3. Deploy Backend (Docker)
1. New -> Web Service -> select your repo.
2. Name: `skydesk360-backend`.
3. Root Directory: `Backend`
4. Runtime: `Docker`
5. Dockerfile Path: `./Dockerfile`
6. Set environment variables:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<strong-random-32+-chars>`
   - `ALGORITHM=HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES=30`
   - `DATABASE_URL=<Render postgres external URL>`
   - `CORS_ORIGINS=https://<frontend-service>.onrender.com`
7. Health Check Path: `/docs`
8. Deploy.

## 4. Deploy Frontend (Docker)
1. New -> Web Service -> select same repo.
2. Name: `skydesk360-frontend`.
3. Root Directory: `Frontend`
4. Runtime: `Docker`
5. Dockerfile Path: `./Dockerfile`
6. Add environment variable:
   - `VITE_API_BASE_URL=https://<backend-service>.onrender.com`
7. Deploy.

## 5. Final Validation
1. Open frontend URL.
2. Register a new user.
3. Login and test booking flow.
4. Check backend logs in Render if any API call fails.

## Local Docker Commands
From repo root:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`

## Notes
- Backend supports Render `PORT` automatically.
- Frontend image injects `VITE_API_BASE_URL` at runtime startup.
- Backend config already normalizes `postgres://` to `postgresql://`.
- Update backend `CORS_ORIGINS` whenever frontend domain changes.

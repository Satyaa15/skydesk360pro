# SkyDesk360 Frontend

React + Vite frontend for SkyDesk360 coworking workspace booking.

## Environment

Create `Frontend/.env` from `Frontend/.env.example`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Run (Docker)

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8000 -t skydesk-frontend ./Frontend
docker run --rm -p 5173:4173 skydesk-frontend
```

## Notes

- Authentication uses backend API endpoints (`/auth/register` and `/auth/login`).
- Production build is code-split with lazy routes.
- SPA refresh/deep-link support:
  - Apache/LiteSpeed: `public/.htaccess` rewrites all routes to `index.html`.
  - Static hosts with custom 404 pages: `public/404.html` redirects back to the original route.
  - Render Static Site: add rewrite `/* -> /index.html` in Render Dashboard if needed.

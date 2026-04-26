# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with a placeholder; the entrypoint replaces it at runtime.
ARG VITE_API_BASE_URL=__API_BASE_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Runner stage: nginx (reliable SPA routing via try_files) ─────────────────
FROM nginx:1.27-alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx site config (we write our own at runtime)
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Render injects PORT at runtime; default matches Render's typical value
ENV PORT=10000
ENV VITE_API_BASE_URL=http://127.0.0.1:8000

EXPOSE 10000

CMD ["/entrypoint.sh"]

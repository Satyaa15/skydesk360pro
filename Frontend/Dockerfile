# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with a placeholder; replace it at runtime in the final image.
ARG VITE_API_BASE_URL=__API_BASE_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 4173

ENV VITE_API_BASE_URL=http://127.0.0.1:8000

CMD ["sh", "-c", "find dist -type f -name '*.js' -exec sed -i \"s|__API_BASE_URL__|${VITE_API_BASE_URL}|g\" {} + && serve -s dist -l ${PORT:-4173}"]
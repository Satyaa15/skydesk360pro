#!/bin/sh
set -e

PORT="${PORT:-10000}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:8000}"

# Substitute API URL placeholder in JS bundles
find /usr/share/nginx/html -name '*.js' \
    -exec sed -i "s|__API_BASE_URL__|${VITE_API_BASE_URL}|g" {} +

# Write nginx config — single-quoted heredoc prevents $uri expansion
cat > /etc/nginx/conf.d/default.conf << 'NGINX_EOF'
server {
    listen %%PORT%%;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing: unknown paths fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-lived cache for hashed assets
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # No cache for HTML
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINX_EOF

# Inject the real port
sed -i "s/%%PORT%%/${PORT}/g" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

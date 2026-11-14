#!/bin/sh
set -eu

if [ -z "${API_URL:-}" ]; then
    echo "WARNING: API_URL is not set, the frontend will use its default API URL" >&2
    exit 0
fi

printf 'window.__CONFIG__ = { API_URL: "%s" };\n' "$API_URL" > /usr/share/nginx/html/config.js
echo "Runtime config written: API_URL=$API_URL"
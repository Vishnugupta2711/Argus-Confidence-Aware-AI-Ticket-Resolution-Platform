#!/bin/bash
set -e

SERVICE=${SERVICE:-all}

if [ "$1" != "all" ] && [ -n "$1" ]; then
    SERVICE=$1
fi

echo "Starting Argus Service: $SERVICE"

if [ "$SERVICE" = "backend" ]; then
    cd /app/backend
    exec uvicorn api.main:app --host 0.0.0.0 --port 8005
elif [ "$SERVICE" = "sandbox" ]; then
    cd /app/sandbox
    exec uvicorn main:app --host 0.0.0.0 --port 8001
elif [ "$SERVICE" = "frontend" ]; then
    cd /app/frontend
    exec npm run preview -- --host 0.0.0.0 --port 5173
elif [ "$SERVICE" = "all" ]; then
    exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
else
    echo "Unknown service: $SERVICE"
    echo "Usage: SERVICE=frontend|backend|sandbox|all"
    exit 1
fi

#!/bin/sh
set -e

# Default values if not specified in environment
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-2}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DEBUG="${DEBUG:-False}"

echo "=================================================="
echo " Starting QtechCRM Backend"
echo " Environment: $ENVIRONMENT"
echo " Host: $HOST | Port: $PORT | Workers: $WORKERS"
echo "=================================================="

if [ "$ENVIRONMENT" = "development" ] || [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
    echo "Running with Uvicorn hot-reload (Development)..."
    exec uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
else
    echo "Running with Uvicorn $WORKERS production workers..."
    exec uvicorn app.main:app --host "$HOST" --port "$PORT" --workers "$WORKERS"
fi

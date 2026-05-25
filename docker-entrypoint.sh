#!/bin/sh
set -e

# Start Next.js frontend on port 3000 in the background
cd /app/apps/web
echo "[entrypoint] Starting Next.js on port 3000..."
bun run start --port 3000 &
NEXT_PID=$!

# Start Express API on port 8000 in the foreground
cd /app/apps/api
echo "[entrypoint] Starting API on port 8000..."
bun run start &
API_PID=$!

# Trap to kill both on exit
trap "kill $NEXT_PID $API_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for either to exit
wait $API_PID

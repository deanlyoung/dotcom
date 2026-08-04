#!/bin/bash
# serve.sh — Start live-server on port 8000, but only if it's not already running.
# If the port is already in use, print a helpful message and exit gracefully.

PORT=8000

# Check if something is already listening on the port
if lsof -i :"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ Server is already running at http://127.0.0.1:$PORT"
  echo "   Open: open http://127.0.0.1:$PORT"
  exit 0
fi

# Start live-server
echo "Starting live-server on port $PORT..."
exec live-server --port="$PORT"
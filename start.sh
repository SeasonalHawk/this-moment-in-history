#!/usr/bin/env bash
# ──────────────────────────────────────────────────
# start.sh — Launch the This Moment in History dev server
# Usage:  ./start.sh          (foreground, Ctrl-C to stop)
#         ./start.sh --bg     (background, use ./stop.sh to stop)
# ──────────────────────────────────────────────────
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.dev.pid"
LOG_FILE="$PROJECT_DIR/.dev.log"
PORT=3000

# ── Cleanup from previous session ────────────────
# Always run full cleanup on startup in case of prior crash,
# forced terminal close, or unclean shutdown.
echo "🧹 Cleaning up previous session..."

# 1. Kill process from PID file (if still alive)
if [ -f "$PID_FILE" ]; then
  EXISTING_PID=$(cat "$PID_FILE")
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "   Stopping previous server (PID $EXISTING_PID)..."
    kill -- -"$EXISTING_PID" 2>/dev/null || kill "$EXISTING_PID" 2>/dev/null || true
    sleep 1
    # Force kill if graceful failed
    if kill -0 "$EXISTING_PID" 2>/dev/null; then
      kill -9 -- -"$EXISTING_PID" 2>/dev/null || kill -9 "$EXISTING_PID" 2>/dev/null || true
      sleep 1
    fi
  fi
  rm -f "$PID_FILE"
fi

# 2. Kill anything lingering on the port
if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "   Clearing port $PORT..."
  lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# 3. Kill orphaned Next.js processes from THIS project only
# Use the project directory in the match to avoid killing other projects' servers
ORPHANS=$(pgrep -f "next dev.*$(basename "$PROJECT_DIR")" 2>/dev/null || true)
if [ -n "$ORPHANS" ]; then
  echo "   Killing orphaned Next.js processes..."
  echo "$ORPHANS" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# 4. Clear stale runtime files
rm -f "$PID_FILE" "$LOG_FILE"

echo "   Done — clean slate"

cd "$PROJECT_DIR"

# ── Load .env.local into shell environment ───────
# Next.js auto-loads .env.local in foreground, but nohup can
# lose the working directory context. Export vars explicitly
# so background mode always has them.
# Uses line-by-line parsing to safely handle special characters
# in values (e.g., $, backticks) without shell interpretation.
if [ -f "$PROJECT_DIR/.env.local" ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ -z "$key" || "$key" == \#* ]] && continue
    declare -x "$key=$value"
  done < "$PROJECT_DIR/.env.local"
  echo "   Loaded .env.local"
fi

# ── Background mode ─────────────────────────────
if [[ "${1:-}" == "--bg" ]]; then
  echo "🚀 Starting dev server in background on port $PORT..."
  nohup pnpm dev > "$LOG_FILE" 2>&1 &
  DEV_PID=$!
  echo "$DEV_PID" > "$PID_FILE"

  # Wait for the server to be ready
  echo -n "   Waiting for server"
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
      echo ""
      echo "✅ Server ready at http://localhost:$PORT (PID $DEV_PID)"
      echo "   Logs:  tail -f $LOG_FILE"
      echo "   Stop:  ./stop.sh"
      exit 0
    fi
    echo -n "."
    sleep 1
  done
  echo ""
  echo "⚠  Server started but port $PORT not responding yet"
  echo "   Check logs:  tail -f $LOG_FILE"
  exit 0
fi

# ── Foreground mode (default) ────────────────────
echo "🚀 Starting dev server on port $PORT..."
echo "   Press Ctrl-C to stop"
echo ""

# Write PID so stop.sh can find it, then clean up on exit.
# exec replaces this shell with pnpm dev, so the PID file
# points to the actual server process (not a wrapper shell).
echo "$$" > "$PID_FILE"
trap 'rm -f "$PID_FILE"; echo ""; echo "👋 Server stopped"' EXIT INT TERM

exec pnpm dev

#!/usr/bin/env bash
# ──────────────────────────────────────────────────
# stop.sh — Stop all dev processes for This Moment in History
# Usage:  ./stop.sh            (graceful shutdown)
#         ./stop.sh --force    (immediate kill)
# ──────────────────────────────────────────────────
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.dev.pid"
LOG_FILE="$PROJECT_DIR/.dev.log"
PORT=3000
FORCE="${1:-}"
KILLED=0

echo "🛑 Stopping This Moment in History dev server..."

# ── 1. Kill by PID file (most reliable) ─────────
if [ -f "$PID_FILE" ]; then
  DEV_PID=$(cat "$PID_FILE")
  if kill -0 "$DEV_PID" 2>/dev/null; then
    echo "   Killing process tree (PID $DEV_PID)..."
    if [[ "$FORCE" == "--force" ]]; then
      kill -9 -- -"$DEV_PID" 2>/dev/null || kill -9 "$DEV_PID" 2>/dev/null || true
    else
      kill -- -"$DEV_PID" 2>/dev/null || kill "$DEV_PID" 2>/dev/null || true
      # Wait up to 5 seconds for graceful shutdown
      for i in $(seq 1 5); do
        kill -0 "$DEV_PID" 2>/dev/null || break
        sleep 1
      done
      # Force kill if still alive
      if kill -0 "$DEV_PID" 2>/dev/null; then
        echo "   Graceful shutdown timed out — force killing..."
        kill -9 -- -"$DEV_PID" 2>/dev/null || kill -9 "$DEV_PID" 2>/dev/null || true
      fi
    fi
    KILLED=1
  else
    echo "   PID $DEV_PID no longer running (stale PID file)"
  fi
  rm -f "$PID_FILE"
fi

# ── 2. Kill anything left on the port ────────────
if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "   Killing remaining processes on port $PORT..."
  lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
  KILLED=1
  sleep 1
fi

# ── 3. Kill orphaned Next.js / Node processes ───
# Scoped to this project directory to avoid killing other projects' servers
ORPHANS=$(pgrep -f "next dev.*$(basename "$PROJECT_DIR")" 2>/dev/null || true)
if [ -n "$ORPHANS" ]; then
  echo "   Killing orphaned Next.js processes..."
  echo "$ORPHANS" | xargs kill -9 2>/dev/null || true
  KILLED=1
fi

# ── 4. Clean up ─────────────────────────────────
rm -f "$PID_FILE"

if [ "$KILLED" -eq 1 ]; then
  echo "✅ All processes stopped"
else
  echo "ℹ  No running processes found"
fi

# Verify port is free
if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "⚠  Warning: port $PORT still occupied"
  echo "   Run: lsof -ti :$PORT | xargs kill -9"
else
  echo "🟢 Port $PORT is free"
fi

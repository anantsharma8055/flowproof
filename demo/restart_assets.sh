#!/bin/sh
pkill -f "services.assets.main" ; sleep 1
cd "$(dirname "$0")/.." && (uv run uvicorn services.assets.main:app --port 8002 >/dev/null 2>&1 &) ; sleep 3

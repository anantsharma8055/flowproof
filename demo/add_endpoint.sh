#!/bin/sh
# Live demo step: add GET /assets/{id}/warranty-history to the Asset Registry, then restart it.
cd "$(dirname "$0")/.."
grep -q warranty-history services/assets/main.py || { echo >> services/assets/main.py; cat demo/warranty_history.py >> services/assets/main.py; }
sh demo/restart_assets.sh

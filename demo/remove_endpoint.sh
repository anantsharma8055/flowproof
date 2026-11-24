#!/bin/sh
cd "$(dirname "$0")/.."
python3 - <<'P'
p = "services/assets/main.py"; s = open(p).read()
i = s.find("\n# Appended to services"); i = i if i != -1 else s.find('\n@app.get("/assets/{asset_id}/warranty-history"')
open(p, "w").write(s[:i].rstrip() + "\n") if i != -1 else None
P
sh demo/restart_assets.sh

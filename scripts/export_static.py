"""Freeze the running dashboard into docs/ (a static, read-only recorded demo).
Run with the dashboard up in the state you want recorded:  uv run python scripts/export_static.py
Host docs/ anywhere static (GitHub Pages: Settings > Pages > /docs, or Vercel with root directory docs)."""
import json, shutil, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
DOCS, API, LABEL = ROOT / "docs", "http://localhost:8000", "hosted_baseline"
(DOCS / "data").mkdir(parents=True, exist_ok=True)
get = lambda p: requests.get(API + p, timeout=60).json()

cfg = get("/api/config")
cfg["snapshots"] = [LABEL]  # the page can only show the one recorded comparison
for name, data in {"servers": get("/api/servers"), "runs": get("/api/runs"), "scenarios": get("/api/scenarios"),
                   "config": cfg, "diff": get(f"/api/diff/{LABEL}")}.items():
    (DOCS / "data" / f"{name}.json").write_text(json.dumps(data, indent=1))

for f in ("app.css", "app.js"):
    shutil.copy(ROOT / "frontend" / f, DOCS / f)
when = time.strftime("%d %b %Y", time.localtime())
html = (ROOT / "frontend" / "index.html").read_text().replace("/static/", "")
html = html.replace("</head>", "<script>window.FP_STATIC=true</script>\n</head>").replace(
    "</body>", f'<div class="rec-banner"><b>Recorded demo</b> · captured {when} from a live run · <a href="https://github.com/anantsharma8055/flowproof">run it yourself</a></div>\n</body>')
(DOCS / "index.html").write_text(html)
print("exported", sorted(p.name for p in (DOCS / "data").iterdir()))

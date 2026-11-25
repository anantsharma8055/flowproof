"""Thin HTTP layer over the CLI engine for the dashboard. Run: uv run uvicorn backend.api:app --port 8000"""
import json
from pathlib import Path
import yaml
from fastapi import FastAPI
from fastapi.responses import FileResponse
from backend import contract
from backend.agent import run_agent
from backend.evaluator import evaluate
from backend.mcp_client import MultiMCP
from backend.scanner import scan

ROOT = Path(__file__).resolve().parents[1]
app = FastAPI(title="FlowProof")
scenarios = lambda: yaml.safe_load((ROOT / "scenarios" / "workflows.yaml").read_text())


@app.get("/")
def index():
    return FileResponse(ROOT / "frontend" / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/api/scan")
def api_scan(base: str, workflow: str = ""):
    return scan(base, workflow)


@app.get("/api/scenarios")
def api_scenarios():
    return scenarios()


@app.get("/api/scoreboard")
def api_scoreboard():
    """Latest saved CLI result per scenario: pass count plus how many runs passed each of the three checks."""
    latest = {}
    for f in sorted((ROOT / "data" / "runs").glob("*.json")):
        try:
            for e in json.loads(f.read_text()):
                latest[e["scenario"]] = {**e, "at": int(f.stem)}
        except (ValueError, KeyError):
            continue  # a half-written or foreign file must not break the dashboard
    rows = []
    for sc in scenarios():
        e, run = latest.get(sc["id"]), None
        if e:
            res = e["results"]
            run = {"passed": e["passed"], "runs": e["runs"], "at": e["at"],
                   "checks": {k: sum(1 for r in res if r["verdict"].get(k, {}).get("ok")) for k in ("answer", "trajectory", "safety")}}
        rows.append({"id": sc["id"], "question": sc["question"], "writes": sc.get("writes"), "run": run})
    return rows


@app.get("/api/snapshots")
def api_snaps():
    return sorted(p.stem for p in (ROOT / "data" / "snapshots").glob("*.json"))


@app.post("/api/snapshot/{label}")
async def api_snapshot(label: str):
    async with MultiMCP() as m:
        contract.save(contract.snapshot(m.tools), label)
    return {"saved": label}


@app.get("/api/diff/{label}")
async def api_diff(label: str):
    async with MultiMCP() as m:
        d = contract.diff(contract.load(label), contract.snapshot(m.tools))
        return {**d, "affected": contract.affected(scenarios(), d), "lint": contract.lint(m.tools), "tools": {k: t["is_write"] for k, t in m.tools.items()}}


@app.post("/api/run/{sid}")
async def api_run(sid: str, approve: bool = False):
    sc = next(s for s in scenarios() if s["id"] == sid)
    async with MultiMCP() as m:
        r = await run_agent(m, sc["question"], approve_writes=approve)
    r["approved"] = approve
    return {**r, "verdict": evaluate(sc, r)}


def _endpoints(base: str, tools: dict) -> dict:
    """Best-effort tool -> 'METHOD /path' by matching tool-name words to OpenAPI paths. shortcut: heuristic, upgrade to reading Synapse's own tool manifest."""
    import re, requests
    try:
        spec = requests.get(base.rstrip("/") + "/openapi.json", timeout=3).json()["paths"]
    except Exception:
        return {}
    words = lambda s: {w for w in re.split(r"[^a-z]+", s.lower()) if w and w not in {"get", "list", "by", "id", "create", "post", "new", "a", "the"}}
    out = {}
    for k, t in tools.items():
        best, score = None, 0
        for path, ops in spec.items():
            for meth, op in ops.items():
                if (meth.upper() != "GET") != t["is_write"] and not (t["is_write"] and meth.upper() == "POST"):
                    continue
                nw = words(t["name"])
                sc = len(nw & words(path)) * 3 + len(nw & words(op.get("summary", ""))) - len(words(path) - nw) * 2
                if sc > score:
                    best, score = f"{meth.upper()} {path}", sc
        if best:
            out[k] = best
    return out


_SRV = {"at": 0, "data": None}


@app.get("/api/servers")
async def api_servers(fresh: bool = False):
    """Spawning the MCP servers takes seconds, so reuse the last probe for 30s unless the caller asks for a fresh health check."""
    import time
    if not fresh and _SRV["data"] and time.time() - _SRV["at"] < 30:
        return _SRV["data"]
    async with MultiMCP() as m:
        out = []
        for name, cfg in m.config.items():
            t0 = time.perf_counter()
            await m.sessions[name].list_tools()
            ping = round((time.perf_counter() - t0) * 1000)
            tools = {k: t for k, t in m.tools.items() if t["server"] == name}
            base = (cfg.get("env") or {}).get("ENDPOINT_BASE_URL", "")
            ep = _endpoints(base, tools) if base else {}
            out.append({"name": name, "url": base or "stdio", "ping_ms": ping, "checked_at": int(time.time()),
                        "tools": [{"id": k, "name": t["name"], "description": t["description"], "schema": t["inputSchema"],
                                   "write": t["is_write"], "method": "POST" if t["is_write"] else "GET", "endpoint": ep.get(k, "")} for k, t in tools.items()]})
        _SRV.update(at=time.time(), data=out)
        return out


@app.get("/api/runs")
def api_runs():
    rows = []
    for f in sorted((ROOT / "data" / "runs").glob("*.json"), reverse=True):
        try:
            for e in json.loads(f.read_text()):
                for i, r in enumerate(e["results"]):
                    tr = r.get("trace", [])
                    rows.append({"id": f"{f.stem}-{e['scenario']}-{i}", "scenario": e["scenario"], "at": int(f.stem), "passed": bool(r["verdict"]["passed"]),
                                 "verdict": r["verdict"], "trace": tr, "answer": r.get("answer", ""), "error": r.get("error", ""),
                                 "servers": sorted({t["server"] for t in tr if t["server"] != "?"}), "ms": sum(t.get("ms", 0) for t in tr) or None})
        except (ValueError, KeyError):
            continue
    return rows[:300]


@app.get("/api/config")
def api_config():
    import os
    from backend import agent
    from backend.mcp_client import ROOT as R
    return {"model": agent.MODEL, "fallbacks": agent.MODELS[1:], "llm_host": os.environ.get("FLOWPROOF_BASE_URL", "api.groq.com").split("//")[-1].split("/")[0],
            "servers_file": os.environ.get("FLOWPROOF_SERVERS", "servers.json"), "has_synapse_key": bool(os.environ.get("SYNAPSE_API_KEY")),
            "snapshots": sorted(p.stem for p in (R / "data" / "snapshots").glob("*.json"))}


@app.post("/api/ask")
async def api_ask(question: str, approve: bool = False):
    """Run a free-form workflow (no scenario, so nothing is graded)."""
    async with MultiMCP() as m:
        return await run_agent(m, question, approve_writes=approve)

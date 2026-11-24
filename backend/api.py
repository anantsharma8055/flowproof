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
    return FileResponse(ROOT / "frontend" / "index.html")


@app.get("/api/scan")
def api_scan(base: str, workflow: str = ""):
    return scan(base, workflow)


@app.get("/api/scenarios")
def api_scenarios():
    return scenarios()


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
        return {**d, "affected": contract.affected(scenarios(), d), "tools": {k: t["is_write"] for k, t in m.tools.items()}}


@app.post("/api/run/{sid}")
async def api_run(sid: str, approve: bool = False):
    sc = next(s for s in scenarios() if s["id"] == sid)
    async with MultiMCP() as m:
        r = await run_agent(m, sc["question"], approve_writes=approve)
    r["approved"] = approve
    return {**r, "verdict": evaluate(sc, r)}

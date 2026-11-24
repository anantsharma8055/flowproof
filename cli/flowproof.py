"""flowproof tools | snapshot <label> | diff <label> | run [ids] [--runs N] [--approve] | rerun <label>"""
import argparse, asyncio, json, sys, time
from pathlib import Path
import yaml
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend import contract
from backend.agent import run_agent
from backend.evaluator import evaluate
from backend.mcp_client import MultiMCP

ROOT = Path(__file__).resolve().parents[1]
SCENARIOS = yaml.safe_load((ROOT / "scenarios" / "workflows.yaml").read_text())


async def run_scenarios(mcp, ids, runs, approve):
    out = []
    for sc in SCENARIOS:
        if ids and sc["id"] not in ids:
            continue
        results = []
        for _ in range(runs):
            r = await run_agent(mcp, sc["question"], approve_writes=approve)
            r["approved"] = approve
            results.append({**r, "verdict": evaluate(sc, r)})
        passed = sum(x["verdict"]["passed"] for x in results)
        print(f"{'PASS' if passed == runs else 'FAIL'}  {sc['id']:<24} {passed}/{runs} runs")
        if results[-1].get("error"):
            print("      error     ", results[-1]["error"])
        for k, v in results[-1]["verdict"].items():
            if isinstance(v, dict):
                print(f"      {k:<11}{'ok ' if v['ok'] else 'BAD'} {v['detail']}")
        out.append({"scenario": sc["id"], "passed": passed, "runs": runs, "results": results})
    d = ROOT / "data" / "runs"; d.mkdir(parents=True, exist_ok=True)
    (d / f"{int(time.time())}.json").write_text(json.dumps(out, indent=2, default=str))
    return out


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["tools", "snapshot", "diff", "run", "rerun"])
    ap.add_argument("arg", nargs="*"); ap.add_argument("--runs", type=int, default=1); ap.add_argument("--approve", action="store_true")
    a = ap.parse_args()
    async with MultiMCP() as mcp:
        if a.cmd == "tools":
            for k, t in mcp.tools.items():
                print(f"{'WRITE' if t['is_write'] else 'read ':<6}{k}  [{t['write_source']}]")
        elif a.cmd == "snapshot":
            contract.save(contract.snapshot(mcp.tools), a.arg[0]); print("saved", a.arg[0])
        elif a.cmd in ("diff", "rerun"):
            d = contract.diff(contract.load(a.arg[0]), contract.snapshot(mcp.tools))
            for k, v in d.items():
                print(f"{k:<13}{v}")
            aff = contract.affected(SCENARIOS, d)
            print("affected scenarios:", aff)
            if a.cmd == "rerun" and aff:
                await run_scenarios(mcp, aff, a.runs, a.approve)
        else:
            await run_scenarios(mcp, a.arg, a.runs, a.approve)

asyncio.run(main())

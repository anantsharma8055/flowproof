"""Agent-readiness score per endpoint and a minimal endpoint recommendation for a workflow, from OpenAPI."""
import re
import httpx

STOP = set("the a an of and or to for with by is are in on which what who all each their its that this show list find".split())


def words(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]+", s.lower()) if w not in STOP and len(w) > 2}


def score_op(method: str, path: str, op: dict) -> dict:
    summ, params = op.get("summary", ""), op.get("parameters", [])
    checks = {
        "has_description": (25, len(summ.split()) >= 4),
        "typed_params": (20, all("type" in p.get("schema", {}) or "anyOf" in p.get("schema", {}) for p in params)),
        "write_is_flagged": (15, method == "get" or "changes data" in summ.lower()),
        "filterable_list": (15, method != "get" or path.count("{") > 0 or len(params) > 0),
        "clear_path": (10, bool(re.fullmatch(r"(/[a-z\-]+(/\{\w+\})?)+", path))),
        "typed_response": (15, bool(op["responses"]["200"]["content"]["application/json"]["schema"].get("$ref") or op["responses"]["200"]["content"]["application/json"]["schema"].get("properties"))),
    }
    return {"score": sum(w for w, ok in checks.values() if ok), "missing": [k for k, (w, ok) in checks.items() if not ok]}


def scan(base: str, workflow: str = "") -> dict:
    spec = httpx.get(f"{base}/openapi.json").json()
    rows, wf = [], words(workflow)
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            s = score_op(method, path, op)
            hit = wf & words(op.get("summary", "") + " " + path)
            rows.append({"route": f"{method.upper()} {path}", "write": method != "get", **s,
                         "relevance": len(hit), "why": sorted(hit)})
    # shortcut: keyword overlap, not embeddings; upgrade to an LLM/embedding ranker when workflows get vague
    rec = [r["route"] for r in rows if r["relevance"] and not r["write"]] + [r["route"] for r in rows if r["relevance"] and r["write"]]
    return {"title": spec["info"]["title"], "overall": round(sum(r["score"] for r in rows) / max(len(rows), 1)),
            "endpoints": rows, "recommended": rec,
            "command": f'synapse build --auto --endpoints "{",".join(rec)}"' if rec else None}

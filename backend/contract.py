"""Snapshot and diff the tool contract (name + description + input schema) of every connected server."""
import hashlib, json
from pathlib import Path

SNAP = Path(__file__).resolve().parents[1] / "data" / "snapshots"


def snapshot(tools: dict) -> dict:
    return {k: {"hash": hashlib.sha256(json.dumps([t["description"], t["inputSchema"], t["is_write"]], sort_keys=True).encode()).hexdigest()[:12],
                "is_write": t["is_write"], "description": t["description"]} for k, t in tools.items()}


def save(snap: dict, label: str):
    SNAP.mkdir(parents=True, exist_ok=True)
    (SNAP / f"{label}.json").write_text(json.dumps(snap, indent=2))


def load(label: str) -> dict:
    return json.loads((SNAP / f"{label}.json").read_text())


def diff(old: dict, new: dict) -> dict:
    return {"added": sorted(set(new) - set(old)), "removed": sorted(set(old) - set(new)),
            "changed": sorted(k for k in set(old) & set(new) if old[k]["hash"] != new[k]["hash"]),
            # a tool that flipped from read to write is a safety regression, reported on its own
            "became_write": sorted(k for k in set(old) & set(new) if not old[k]["is_write"] and new[k]["is_write"])}


def affected(scenarios: list[dict], d: dict) -> list[str]:
    """Removed/changed tools hit scenarios that depend on them (exact tool name); added tools hit scenarios that expect that capability."""
    base = lambda t: t.split("__", 1)[-1]
    hit = lambda s: any(base(t) in s.get("depends_on", []) for t in d["removed"] + d["changed"]) or \
        any(base(t).endswith(p) for p in s.get("expect_tools", []) for t in d["added"])
    return [s["id"] for s in scenarios if hit(s)]

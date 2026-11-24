"""Ground truth computed straight from the databases, never from the model."""
import sqlite3
from pathlib import Path

D = Path(__file__).resolve().parents[1] / "data"


def _q(db, sql):
    return sqlite3.connect(D / db).execute(sql).fetchall()


def critical_asset_tickets() -> set[int]:
    crit = {r[0] for r in _q("assets.db", "SELECT id FROM assets WHERE criticality='business_critical'")}
    hot = {r[0] for r in _q("helpdesk.db", "SELECT asset_id FROM tickets WHERE status!='resolved' AND severity='high'")}
    return crit & hot


def repeat_faults() -> set[int]:
    laptops = {r[0] for r in _q("assets.db", "SELECT id FROM assets WHERE type='laptop'")}
    rep = {r[0] for r in _q("helpdesk.db", "SELECT asset_id FROM tickets GROUP BY asset_id HAVING COUNT(*)>=3")}
    return laptops & rep


FUNCS = {"critical_asset_tickets": critical_asset_tickets, "repeat_faults": repeat_faults}

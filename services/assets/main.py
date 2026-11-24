import os, sqlite3, sys
from pathlib import Path
from fastapi import FastAPI, HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from seed import ASSETS

DB = os.environ.get("ASSETS_DB", str(Path(__file__).resolve().parents[2] / "data" / "assets.db"))
app = FastAPI(title="Asset Registry API")


def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def init():
    c = db()
    c.execute("CREATE TABLE IF NOT EXISTS assets(id INTEGER PRIMARY KEY, type TEXT, model TEXT, owner_employee_id INT, department TEXT, criticality TEXT, purchase_date TEXT, warranty_expiry TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS replacement_requests(id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INT, reason TEXT)")
    if not c.execute("SELECT 1 FROM assets").fetchone():
        c.executemany("INSERT INTO assets VALUES(:id,:type,:model,:owner_employee_id,:department,:criticality,:purchase_date,:warranty_expiry)", ASSETS)
        c.commit()
    c.close()


init()


@app.get("/assets", summary="List assets, optionally filtered by type or criticality (low, medium, high, business_critical)")
def list_assets(type: str | None = None, criticality: str | None = None):
    q, a = "SELECT * FROM assets WHERE 1=1", []
    for col, v in (("type", type), ("criticality", criticality)):
        if v is not None:
            q += f" AND {col}=?"
            a.append(v)
    return [dict(r) for r in db().execute(q, a)]


@app.get("/assets/{asset_id}", summary="Get one asset with owner, criticality and warranty expiry date")
def get_asset(asset_id: int):
    r = db().execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone()
    if not r:
        raise HTTPException(404, "asset not found")
    return dict(r)


@app.post("/replacement-requests", summary="Create a replacement request for an asset (changes data)")
def create_replacement_request(asset_id: int, reason: str):
    c = db()
    cur = c.execute("INSERT INTO replacement_requests(asset_id, reason) VALUES(?,?)", (asset_id, reason))
    c.commit()
    return {"ok": True, "request_id": cur.lastrowid}

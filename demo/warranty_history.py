# Appended to services/assets/main.py during the live demo (see demo/add_endpoint.sh)

CLAIMS = {3: [{"date": "2026-03-14", "issue": "battery swelling"}, {"date": "2026-08-02", "issue": "keyboard failure"}]}


@app.get("/assets/{asset_id}/warranty-history", summary="Get the warranty claims history of an asset")
def warranty_history(asset_id: int):
    r = db().execute("SELECT id, purchase_date, warranty_expiry FROM assets WHERE id=?", (asset_id,)).fetchone()
    if not r:
        raise HTTPException(404, "asset not found")
    return {"asset_id": asset_id, "purchase_date": r["purchase_date"], "warranty_expiry": r["warranty_expiry"], "claims": CLAIMS.get(asset_id, [])}

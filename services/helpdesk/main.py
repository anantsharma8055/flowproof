import os, sqlite3, sys
from pathlib import Path
from fastapi import FastAPI, HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from seed import EMPLOYEES, TICKETS

DB = os.environ.get("HELPDESK_DB", str(Path(__file__).resolve().parents[2] / "data" / "helpdesk.db"))
app = FastAPI(title="Helpdesk API")


def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def init():
    c = db()
    c.execute("CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY, name TEXT, department TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY, employee_id INT, asset_id INT, title TEXT, severity TEXT, status TEXT, assigned_to TEXT, created_at TEXT)")
    if not c.execute("SELECT 1 FROM employees").fetchone():
        c.executemany("INSERT INTO employees VALUES(:id,:name,:department)", EMPLOYEES)
        c.executemany("INSERT INTO tickets VALUES(:id,:employee_id,:asset_id,:title,:severity,:status,:assigned_to,:created_at)", TICKETS)
        c.commit()
    c.close()


init()


@app.get("/employees", summary="List employees with their department")
def list_employees():
    return [dict(r) for r in db().execute("SELECT * FROM employees")]


@app.get("/employees/{employee_id}", summary="Get one employee by id")
def get_employee(employee_id: int):
    r = db().execute("SELECT * FROM employees WHERE id=?", (employee_id,)).fetchone()
    if not r:
        raise HTTPException(404, "employee not found")
    return dict(r)


@app.get("/tickets", summary="List support tickets, optionally filtered by status, severity or asset id")
def list_tickets(status: str | None = None, severity: str | None = None, asset_id: int | None = None):
    q, a = "SELECT * FROM tickets WHERE 1=1", []
    for col, v in (("status", status), ("severity", severity), ("asset_id", asset_id)):
        if v is not None:
            q += f" AND {col}=?"
            a.append(v)
    return [dict(r) for r in db().execute(q, a)]


@app.get("/tickets/{ticket_id}", summary="Get one ticket by id")
def get_ticket(ticket_id: int):
    r = db().execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    if not r:
        raise HTTPException(404, "ticket not found")
    return dict(r)


@app.post("/tickets/{ticket_id}/escalate", summary="Escalate a ticket to critical severity (changes data)")
def escalate_ticket(ticket_id: int):
    c = db()
    if not c.execute("UPDATE tickets SET severity='high', status='in_progress' WHERE id=?", (ticket_id,)).rowcount:
        raise HTTPException(404, "ticket not found")
    c.commit()
    return {"ok": True, "ticket_id": ticket_id}

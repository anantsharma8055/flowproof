"""Deterministic seed data shared by both services so cross-system answers are checkable."""
import random
from datetime import date, timedelta

R = random.Random(7)
FIRST = ["Aarav","Diya","Kabir","Meera","Rohan","Isha","Vikram","Anaya","Arjun","Sana","Nikhil","Priya","Dev","Tara","Yash","Nisha","Karan","Riya","Manav","Zoya"]
DEPTS = ["Engineering","Finance","HR","Sales","Operations"]
TECHS = ["Tech-Ravi","Tech-Asha","Tech-Imran"]
TODAY = date(2026, 11, 24)

EMPLOYEES = [{"id": i + 1, "name": f"{FIRST[i]} {chr(65 + i)}.", "department": DEPTS[i % 5]} for i in range(20)]

ASSETS = []
for i in range(30):
    kind = "laptop" if i < 22 else "server"
    bought = TODAY - timedelta(days=R.randint(200, 1500))
    warranty = bought + timedelta(days=365 * (3 if kind == "server" else 2))
    ASSETS.append({
        "id": i + 1, "type": kind,
        "model": R.choice(["ThinkPad T14", "MacBook Pro 14", "Dell XPS 13"]) if kind == "laptop" else R.choice(["Dell R750", "HPE DL380"]),
        "owner_employee_id": (i % 20) + 1 if kind == "laptop" else None,
        "department": DEPTS[i % 5],
        "criticality": "business_critical" if (kind == "server" or i % 4 == 0) else R.choice(["low", "medium", "high"]),
        "purchase_date": bought.isoformat(), "warranty_expiry": warranty.isoformat(),
    })

TICKETS = []
# deliberately repeated faults on laptops 3, 7 and 12
hot = [3, 3, 3, 3, 7, 7, 7, 12, 12, 12]
for n in range(40):
    aid = hot[n] if n < len(hot) else R.randint(1, 30)
    asset = ASSETS[aid - 1]
    TICKETS.append({
        "id": n + 1, "employee_id": asset["owner_employee_id"] or R.randint(1, 20), "asset_id": aid,
        "title": R.choice(["Battery drains fast", "Screen flickers", "Won't boot", "Disk errors", "Overheating", "Network drops"]),
        "severity": R.choice(["low", "medium", "high", "high"]),
        "status": R.choice(["open", "in_progress", "resolved"]),
        "assigned_to": R.choice(TECHS), "created_at": (TODAY - timedelta(days=R.randint(1, 120))).isoformat(),
    })

"""List models the configured provider offers: uv run python cli/models.py"""
import os, sys, httpx
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
base = os.environ.get("FLOWPROOF_BASE_URL", "https://api.groq.com/openai/v1")
key = os.environ.get("FLOWPROOF_API_KEY") or os.environ.get("GROQ_API_KEY")
r = httpx.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
print(r.status_code)
for m in r.json().get("data", []): print(m["id"])

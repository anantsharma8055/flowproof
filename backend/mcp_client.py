"""Connects to several MCP servers over stdio; namespaces tools as <server>__<tool>; classifies read/write."""
import json, re
from contextlib import AsyncExitStack
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

WRITE_WORDS = re.compile(r"post|put|patch|delete|create|update|escalate|remove|send|submit|approve|cancel", re.I)
ROOT = Path(__file__).resolve().parents[1]


def classify(tool) -> tuple[bool, str]:
    """Returns (is_write, source). Trusts MCP annotations when present, else falls back to name/description words."""
    ann = getattr(tool, "annotations", None)
    if ann is not None and ann.readOnlyHint is not None:
        return (not ann.readOnlyHint), "annotation"
    return bool(WRITE_WORDS.search(tool.name) or WRITE_WORDS.search(tool.description or "")), "heuristic"


class MultiMCP:
    def __init__(self, config_path=ROOT / "servers.json"):
        self.config = json.loads(Path(config_path).read_text())
        self.sessions, self.tools, self._stack = {}, {}, AsyncExitStack()

    async def __aenter__(self):
        for name, c in self.config.items():
            params = StdioServerParameters(command=c["command"], args=c.get("args", []), env=c.get("env"), cwd=str(ROOT))
            r, w = await self._stack.enter_async_context(stdio_client(params))
            s = await self._stack.enter_async_context(ClientSession(r, w))
            await s.initialize()
            self.sessions[name] = s
            for t in (await s.list_tools()).tools:
                is_write, src = classify(t)
                self.tools[f"{name}__{t.name}"] = {"server": name, "name": t.name, "description": t.description or "",
                                                    "inputSchema": t.inputSchema, "is_write": is_write, "write_source": src}
        return self

    async def __aexit__(self, *a):
        await self._stack.aclose()

    async def call(self, full_name: str, args: dict) -> str:
        t = self.tools[full_name]
        res = await self.sessions[t["server"]].call_tool(t["name"], args)
        return "".join(c.text for c in res.content if getattr(c, "text", None))

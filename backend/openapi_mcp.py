"""Stand-in for a Synapse Auto server: exposes every route of a running OpenAPI service as an MCP tool.
Used so FlowProof can be built and tested without a Synapse key. Re-run it to 'rediscover' routes."""
import argparse, asyncio, re
import httpx
from mcp import types
from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server


def tool_name(method: str, path: str) -> str:
    return method + re.sub(r"[^a-z0-9]+", "_", path.lower().replace("{", "by_").replace("}", "")).rstrip("_")


def build_tools(spec: dict) -> dict:
    tools = {}
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            props, req = {}, []
            for p in op.get("parameters", []):
                props[p["name"]] = {**p["schema"], "description": p["name"]}
                p.get("required") and req.append(p["name"])
            tools[tool_name(method, path)] = (method, path, types.Tool(
                name=tool_name(method, path), description=op.get("summary", ""),
                inputSchema={"type": "object", "properties": props, "required": req},
                annotations=types.ToolAnnotations(readOnlyHint=method == "get")))
    return tools


async def main(base: str, name: str):
    tools = build_tools(httpx.get(f"{base}/openapi.json").json())
    server = Server(name)

    @server.list_tools()
    async def _list():
        return [t for _, _, t in tools.values()]

    @server.call_tool()
    async def _call(tool: str, args: dict):
        method, path, _ = tools[tool]
        for k, v in list(args.items()):
            if "{%s}" % k in path:
                path = path.replace("{%s}" % k, str(v)); args.pop(k)
        r = httpx.request(method.upper(), base + path, params=args)
        return [types.TextContent(type="text", text=r.text)]

    async with stdio_server() as (r, w):
        await server.run(r, w, server.create_initialization_options())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True); ap.add_argument("--name", required=True)
    a = ap.parse_args()
    asyncio.run(main(a.base, a.name))

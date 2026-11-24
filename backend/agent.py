"""Plain tool-calling loop. Every call is traced; write tools go through the approval gate."""
import os
from anthropic import AsyncAnthropic

MODEL = os.environ.get("FLOWPROOF_MODEL", "claude-sonnet-5-5")
SYSTEM = ("You are an IT operations copilot with tools from several company systems. Use the tools to get facts; never guess. "
          "Cite every asset as 'Asset #<id>'. If no tool can answer part of a question, say exactly what is missing. "
          "Actions that change data need human approval: still call the tool when asked, then report if it was held.")


async def run_agent(mcp, question: str, approve_writes: bool = False, max_steps: int = 12) -> dict:
    client = AsyncAnthropic()
    tools = [{"name": k, "description": t["description"], "input_schema": t["inputSchema"]} for k, t in mcp.tools.items()]
    msgs, trace = [{"role": "user", "content": question}], []
    for _ in range(max_steps):
        r = await client.messages.create(model=MODEL, max_tokens=2000, system=SYSTEM, tools=tools, messages=msgs)
        msgs.append({"role": "assistant", "content": r.content})
        calls = [b for b in r.content if b.type == "tool_use"]
        if not calls:
            return {"answer": "".join(b.text for b in r.content if b.type == "text"), "trace": trace}
        results = []
        for c in calls:
            t = mcp.tools[c.name]
            held = t["is_write"] and not approve_writes  # gate enforced here, not in the prompt
            out = "HELD: this action needs human approval and was not executed." if held else await mcp.call(c.name, c.input)
            trace.append({"tool": c.name, "server": t["server"], "args": c.input, "is_write": t["is_write"], "held": held, "result": out[:300]})
            results.append({"type": "tool_result", "tool_use_id": c.id, "content": out})
        msgs.append({"role": "user", "content": results})
    return {"answer": "", "trace": trace, "error": "max_steps reached"}

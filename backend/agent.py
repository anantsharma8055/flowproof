"""Plain tool-calling loop over any OpenAI-compatible API (Groq by default). Every call is traced; writes go through the approval gate."""
import json, os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()  # reads ~/flowproof/.env if present

MODEL = os.environ.get("FLOWPROOF_MODEL", "llama-3.3-70b-versatile")
BASE_URL = os.environ.get("FLOWPROOF_BASE_URL", "https://api.groq.com/openai/v1")
KEY = os.environ.get("FLOWPROOF_API_KEY") or os.environ.get("GROQ_API_KEY")
SYSTEM = ("You are an IT operations copilot with tools from several company systems. Use the tools to get facts; never guess. "
          "Cite every asset as 'Asset #<id>'. If no tool can answer part of a question, say exactly what is missing. "
          "Actions that change data need human approval: still call the tool when asked, then report if it was held.")


async def run_agent(mcp, question: str, approve_writes: bool = False, max_steps: int = 12) -> dict:
    client = AsyncOpenAI(base_url=BASE_URL, api_key=KEY)
    tools = [{"type": "function", "function": {"name": k, "description": t["description"], "parameters": t["inputSchema"]}} for k, t in mcp.tools.items()]
    msgs, trace = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": question}], []
    for _ in range(max_steps):
        m = (await client.chat.completions.create(model=MODEL, messages=msgs, tools=tools, temperature=0)).choices[0].message
        msgs.append(m.model_dump(exclude_none=True))
        if not m.tool_calls:
            return {"answer": m.content or "", "trace": trace}
        for c in m.tool_calls:
            t = mcp.tools.get(c.function.name)
            if t is None:  # model invented a tool name
                out, held, args = f"ERROR: unknown tool {c.function.name}", False, {}
                trace.append({"tool": c.function.name, "server": "?", "args": args, "is_write": False, "held": False, "result": out})
            else:
                args = json.loads(c.function.arguments or "{}")
                held = t["is_write"] and not approve_writes  # gate enforced here, not in the prompt
                out = "HELD: this action needs human approval and was not executed." if held else await mcp.call(c.function.name, args)
                trace.append({"tool": c.function.name, "server": t["server"], "args": args, "is_write": t["is_write"], "held": held, "result": out[:300]})
            msgs.append({"role": "tool", "tool_call_id": c.id, "content": out[:6000]})  # cap size: free tiers have tight token limits
    return {"answer": "", "trace": trace, "error": "max_steps reached"}

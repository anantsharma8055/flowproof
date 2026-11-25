# FlowProof: CI for agent-ready software

FlowProof checks whether an AI agent can actually finish real business workflows through MCP servers built with
[Synapse](https://www.npmjs.com/package/@2ndbrainlabs-ai/synapse-cli), and tells you what a rebuild changed.

```
FastAPI apps ──synapse build──▶ MCP servers ──▶ agent runner ──▶ evaluator ──▶ dashboard / CLI
(Helpdesk, Assets)              (hosted Auto)   (tool calling,    (answer vs SQL truth,
                                                 write approval)   tools used, safety)
                    synapse build --discover ──▶ contract diff ──▶ rerun only affected workflows
```

## What it does
1. **Scan**: scores each API endpoint for agent-readiness and recommends which to expose (`backend/scanner.py`).
2. **Prove**: runs a tool-calling agent over both MCP servers on cross-system questions. Every run gets three verdicts: the answer
   against SQL ground truth, the tools used, and safety (write tools are held for approval and never executed unapproved).
3. **Change**: snapshots the tool contract, diffs it after `synapse build --discover` (added / removed / schema changed / read to write /
   reworded only), reruns only affected workflows, and lints tools whose description promises parameters the schema hides.

## The dashboard (http://localhost:8000)
Nine screens, all reading real data from the running servers and saved runs:
Overview, MCP Servers, Tool Registry, Workflow Studio (edit a prompt, pick servers, **Run Test** to watch the agent's tool calls light up on a
canvas and get a graded report), Test Runs, Execution Trace (step-by-step timeline with arguments and responses), Analytics, Change Detection
(snapshot comparison, impact analysis, Run Regression Tests) and Settings.

## Run it
```bash
uv sync && cp .env.example .env          # add an LLM key (Gemini or Groq) and SYNAPSE_API_KEY for hosted servers
uv run uvicorn services.helpdesk.main:app --port 8001 &
uv run uvicorn services.assets.main:app --port 8002 &
FLOWPROOF_SERVERS=servers.hosted.json uv run uvicorn backend.api:app --port 8000   # dashboard
```
`servers.json` (the default) uses an OpenAPI-derived stand-in server instead of Synapse, handy without a Synapse key.

CLI: `uv run python cli/flowproof.py tools | lint | snapshot <label> | diff <label> | run [ids] [--runs N] [--approve] | rerun <label>`

## Layout
`services/` sample FastAPI apps and seed data · `backend/` agent, evaluator, contract diff, scanner, API · `cli/` command line ·
`frontend/` dashboard · `scenarios/workflows.yaml` the graded workflows · `demo/` scripts for the live update ·
`data/snapshots/` saved contracts · `tests/` unit tests (`uv run pytest -q`)

## Findings on Synapse 0.1.9
- Hosted builds put only **path** parameters in tool input schemas. Query parameters (filters, write arguments) are dropped even when
  declared with `Query()`, so agents can't see them. `flowproof lint` flags this; exposing filters as path endpoints
  (`/tickets/status/{status}`) works around it.
- Smart-names can rename untouched tools between rebuilds, which shows up as removed plus added. Without it, names are stable but every
  description is just the route.
- Local Auto: tools have no parameters and route-only descriptions; `--discover` writes a second file instead of updating in place.

See SUBMISSION.md for the write-up and DEMO.md for the demo script.

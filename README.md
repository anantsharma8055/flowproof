# FlowProof: CI for agent-ready software

FlowProof checks whether an AI agent can actually finish real business workflows through MCP servers
(built with [Synapse](https://www.npmjs.com/package/@2ndbrainlabs-ai/synapse-cli)), and tells you what broke when the API changes.

1. **Scan**: score each API endpoint for agent-readiness and recommend which to expose for a workflow (prints the `synapse build --endpoints` command).
2. **Prove**: run cross-system scenarios with a tool-calling agent. Each run gets three verdicts:
   answer vs SQL ground truth, tool trajectory, and safety (writes must be held for approval).
3. **Change**: snapshot the tool contract, rebuild with `synapse build --discover`, diff it (added / removed / changed / read→write),
   rerun only the affected scenarios, and **lint** tools whose description promises parameters the schema doesn't declare.

## Run it

```bash
uv sync && cp .env.example .env          # add a free Gemini or Groq key (and SYNAPSE_API_KEY for hosted)
uv run uvicorn services.helpdesk.main:app --port 8001 &
uv run uvicorn services.assets.main:app --port 8002 &
uv run uvicorn backend.api:app --port 8000   # dashboard at http://localhost:8000
```

CLI: `uv run python cli/flowproof.py tools | lint | snapshot <label> | diff <label> | run [ids] [--runs N] [--approve] | rerun <label>`
Use `FLOWPROOF_SERVERS=servers.hosted.json` to test Synapse-hosted servers (default `servers.json` is an OpenAPI-derived stand-in).

## Live demo

```bash
sh demo/add_endpoint.sh      # new GET /assets/{id}/warranty-history
# in services/assets: synapse build --discover --auto --all-endpoints --smart-names --base-url http://localhost:8002 --server-name fp-assets
cli: diff before   # shows 1 added; only affected scenarios rerun and warranty-claims flips to PASS
```

## Findings on Synapse 0.1.9
- Hosted builds name tools well, but input schemas contain only **path** parameters. Query parameters (filters, write args) are dropped even when declared with `Query()`; agents then miss filters (`critical-asset-tickets` fails). `flowproof lint` flags these.
- Local Auto servers have parameterless, route-only tools; `--discover` writes a second file instead of updating in place.
- Rebuilds can rewrite descriptions of untouched tools; FlowProof reports these as changed.

## Tests
`uv run pytest -q`

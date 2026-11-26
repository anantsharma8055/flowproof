# Demo script (about 5 minutes edited, 7 to 8 raw)

**Measured waiting time:** agent runs take 40 to 65 s each, the Synapse rebuild about 30 s, and the diff plus rerun about 40 s, so roughly 3 minutes of
waiting in a raw take. Trim the waits when editing the video, or narrate over them. Hold-and-explain works well during the agent runs.

**Setup (before recording):** both services running on 8001 and 8002; dashboard started with
`FLOWPROOF_SERVERS=servers.hosted.json uv run uvicorn backend.api:app --port 8000`; baseline saved with
`cli/flowproof.py snapshot hosted_baseline`; the warranty endpoint removed (`sh demo/remove_endpoint.sh` plus a `synapse build --discover`).
Fallback if the model is slow: `data/fallback_run.txt` and the saved runs in Test Runs.

1. **Overview (30s)**: 2 of 2 servers connected, workflows, issues detected. "Two Synapse-generated MCP servers from two unmodified FastAPI apps."
2. **MCP Servers and Tool Registry (45s)**: expand the Asset Registry, show real tool schemas, the endpoint each tool maps to, and that
   `create_replacement_request` is a write tool.
3. **Workflow Studio (90s)**: open `repeat-faults`, **Run Test**. The canvas lights up step by step; the report shows three checks
   (answer vs SQL truth, tools used, safety). Then `replacement-requests`: the write is **held** for approval, never executed.
4. **Execution Trace (30s)**: open the run from the report; click a step to show the arguments and the JSON response.
5. **Change Detection, Lint tab (30s)**: three tools flagged. "Hosted Synapse drops query parameters from tool schemas, so the agent can't see
   the filters. FlowProof catches that automatically."
6. **Live update (90s)**: `sh demo/add_endpoint.sh`, then in `services/assets` run
   `synapse build --discover --auto --all-endpoints --smart-names --base-url http://localhost:8002 --server-name fp-assets`.
   In the dashboard click Refresh on MCP Servers, then open Change Detection: the new tool shows as **Added**, wording-only rewrites are listed
   separately, and only `warranty-claims` needs a rerun. Click **Run Regression Tests**: it passes, using a fact the agent can't guess.
7. **Close (20s)**: CI for agent-ready software. Synapse generates the servers, FlowProof proves they still work after every change.

**Reset afterwards:** `sh demo/remove_endpoint.sh`, rerun the same `synapse build --discover`, then `snapshot hosted_baseline`.
**If tool names drift** after a rebuild (Synapse smart-names), say so: FlowProof reports it as removed plus added, which is exactly its job.

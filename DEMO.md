# Demo script (about 4 minutes)

Setup: services on 8001/8002 running, dashboard on 8000 with `FLOWPROOF_SERVERS=servers.hosted.json`, hosted baseline already saved
(`cli/flowproof.py snapshot hosted_baseline`). Fallback if the model is slow: `data/fallback_run.txt`.

1. **Scan** (30s): paste the Asset Registry URL and the workflow "which business-critical assets have unresolved high tickets"; show scores and the recommended `synapse build --endpoints` command.
2. **Prove** (60s): run `repeat-faults` and `replacement-requests`. Point out three verdicts: answer vs SQL truth, trajectory, and the write being HELD for approval.
3. **Lint** (30s): run `flowproof lint`. Hosted Synapse drops query parameters from tool schemas, so the agent can't see the filters; this is why `critical-asset-tickets` fails. Name it as a Synapse finding.
4. **Change** (90s): `sh demo/add_endpoint.sh`, then in services/assets run `synapse build --discover --auto --all-endpoints --smart-names --base-url http://localhost:8002 --server-name fp-assets`.
   Dashboard Change tab, diff vs `hosted_baseline`: 1 added, rewordings listed separately, only `warranty-claims` affected. Rerun it: PASS (needs the real "2 claims" fact).
5. **Close** (30s): CI for agent-ready software; Synapse generates the servers, FlowProof proves they still work after every change.

Reset afterwards: `sh demo/remove_endpoint.sh`, rerun the same `synapse build --discover`, re-save `hosted_baseline` if needed.

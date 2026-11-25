# FlowProof: CI for agent-ready software (Track 4, open innovation)

## Problem
Teams can now turn an existing API into MCP tools in minutes. Nobody checks whether an agent can still finish a real, cross-system
business task through those tools, or what a rebuild silently changed. A tool that exists is not a tool an agent can use.

## What FlowProof does
1. **Scan**: scores each endpoint for agent-readiness and recommends the few worth exposing for a given workflow, as a ready `synapse build --endpoints` command.
2. **Prove**: runs a real tool-calling agent over two Synapse-generated MCP servers (Helpdesk + Asset Registry) on cross-system questions
   (e.g. "which business-critical assets have unresolved high-severity tickets?"). Each run is graded three ways: answer vs SQL ground truth, tool trajectory, and safety (writes held for approval).
3. **Change**: after `synapse build --discover`, diffs the tool contract (added / removed / schema-changed / read to write / reworded only), reruns only the scenarios affected, and lints tools whose description promises parameters the schema doesn't declare.

## Why Synapse is central
Both servers are Synapse hosted-Auto builds of unmodified FastAPI apps. The live update is Synapse's `--discover` (same server id, 1 added, rest unchanged).
FlowProof is the layer that proves the generated servers keep working after each rebuild.

## Results (hosted Synapse, Gemini free tier, 2 runs each, see data/fallback_run.txt)
- repeat-faults 2/2 and replacement-requests 2/2 (all 4 writes held for approval).
- critical-asset-tickets 0/2 and warranty-claims 0/2 before the new endpoint; warranty-claims passes once the endpoint is added and rebuilt.

## Findings for the Synapse team
- Hosted builds put only **path** parameters in tool input schemas. Query parameters (filters, write arguments) are dropped even when declared with FastAPI `Query()`, so agents can't see the filters. This is what makes critical-asset-tickets fail; `flowproof lint` detects it.
- Rebuilds can rewrite the descriptions of untouched tools; FlowProof reports these as "reworded" rather than as contract changes.
- Local Auto: tools have no parameters and route-only descriptions; `--discover` writes a second file instead of updating in place.

- Adding path-based filter endpoints (`/tickets/status/{status}`, `/assets/criticality/{level}`) lifted critical-asset-tickets from 0/3 to 1/3 on hosted Synapse. The rest is model reasoning (it picked a wrong asset), so a stronger model is the next lever.

## Where it goes next
Run in CI on every API change; add scenario packs per domain; compare models by pass rate; gate deploys on readiness score.

## Setup
See README.md (run) and DEMO.md (4-minute demo). MCP config: servers.hosted.json (secrets as `${SYNAPSE_API_KEY}` placeholders, never committed).

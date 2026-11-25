# FlowProof: CI for agent-ready software (Track 4, open innovation)

## Problem
Teams can turn an existing API into MCP tools in minutes. Nobody checks whether an agent can still finish a real, cross-system business
task through those tools, or what a rebuild silently changed. A tool that exists is not a tool an agent can use.

## What FlowProof does
1. **Scan**: scores each endpoint for agent-readiness and recommends the few worth exposing, as a ready `synapse build --endpoints` command.
2. **Prove**: runs a real tool-calling agent over two Synapse-generated MCP servers (Helpdesk and Asset Registry) on cross-system questions
   such as "which business-critical assets have unresolved high-severity tickets?". Each run is graded three ways: answer vs SQL ground truth,
   tools used, and safety (writes held for approval, enforced in the runner rather than the prompt).
3. **Change**: after `synapse build --discover`, diffs the tool contract (added / removed / schema changed / read to write / reworded only),
   reruns only the affected workflows, and lints tools whose description promises parameters the schema hides.

A nine-screen dashboard (Overview, MCP Servers, Tool Registry, Workflow Studio, Test Runs, Execution Trace, Analytics, Change Detection,
Settings) shows all of it from real data, and Run Test executes the real agent live.

## Why Synapse is central
Both servers are Synapse hosted-Auto builds of unmodified FastAPI apps. The live update is Synapse's `--discover` (same server id, one tool added).
FlowProof is the layer that proves the generated servers keep working after each rebuild.

## Results (hosted Synapse, free-tier Gemini model)
RESULTS_PLACEHOLDER

## Findings for the Synapse team
- Hosted builds put only **path** parameters in tool input schemas. Query parameters (filters, write arguments) are dropped even when declared
  with FastAPI `Query()`, so agents can't see them. `flowproof lint` detects it. Exposing filters as path endpoints
  (`/tickets/status/{status}`, `/assets/criticality/{level}`) lifted critical-asset-tickets from 0/3 to 1/3; the rest is model reasoning.
- Smart-names can rename untouched tools between rebuilds, which a diff reports as removed plus added. Without it, names are stable but
  every description is just the route.
- Rebuilds can rewrite the descriptions of untouched tools; FlowProof reports these as "reworded", not as contract changes.
- Local Auto: tools have no parameters and route-only descriptions; `--discover` writes a second file instead of updating in place.

## Where it goes next
Run in CI on every API change; scenario packs per domain; compare models by pass rate; gate deploys on readiness score.

## Setup
README.md (run it), DEMO.md (demo script). MCP config: `servers.hosted.json`, with secrets as `${SYNAPSE_API_KEY}` placeholders, never committed.

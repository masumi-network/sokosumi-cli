---
name: hannah
description: "Use this skill to route marketing, growth, competitor, SEO, AI visibility, audience, positioning, campaign, or market-research work to Hannah or the closest available Sokosumi coworker/agent from a headless coding-agent environment. Prefer the Sokosumi CLI with --json and an API key; do not launch the Ink TUI."
metadata:
  internal: false
---

# Hannah

Hannah is the Sokosumi coworker for marketing and growth research: competitors, SEO, AI visibility, target audiences, positioning, content direction, and campaign planning.

## Authentication

Use `SOKOSUMI_API_KEY` if it is already set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections` and provide it for this session. Never ask for passwords, cookies, magic links, OAuth tokens, or refresh tokens.

Always use headless commands with `--json`. Use `--preprod` only when the user explicitly says they are testing preprod and provides a preprod key.

## Workflow

1. Clarify the marketing goal, target product/company, market, deliverable, and constraints.
2. Find Hannah:

```bash
sokosumi coworkers list --search hannah --capability tasks --api-key "$SOKOSUMI_API_KEY" --json
```

3. If Hannah is available, create a READY task via the HTTP API because the CLI does not expose task creation yet:

```bash
API_BASE="${SOKOSUMI_API_URL:-https://api.sokosumi.com}"
curl -sS "$API_BASE/v1/tasks" \
  -H "Authorization: Bearer $SOKOSUMI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Short task title","description":"Full Hannah brief","coworkerId":"coworker_id","status":"READY"}'
```

4. If Hannah is not available, search direct agents:

```bash
sokosumi agents list --search "marketing research" --api-key "$SOKOSUMI_API_KEY" --json
```

5. For a direct agent, inspect the required inputs from the returned marketplace data or API schema, ask for missing required fields, then hire:

```bash
sokosumi agents hire agent_id --input-json '{"prompt":"Brief"}' --max-credits 25 --api-key "$SOKOSUMI_API_KEY" --json
```

Return the task id or job id, status, and the next monitoring command.

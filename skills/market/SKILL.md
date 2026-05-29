---
name: market
description: "Use this skill for Sokosumi market and marketing workflows: campaign strategy, positioning, competitors, audience research, SEO, AI visibility, and market analysis. Prefer Hannah unless the user explicitly asks for a direct specialist agent."
metadata:
  internal: false
---

# Market

Use Sokosumi for market and marketing work when the user wants an external coworker or agent to produce a business/marketing deliverable.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections`.

## Workflow

1. Clarify the product/company, target market, geography, audience, deliverable, and constraints.
2. Prefer Hannah:

```bash
sokosumi coworkers list --search hannah --capability tasks --api-key "$SOKOSUMI_API_KEY" --json
```

3. Create a READY Hannah task:

```bash
sokosumi tasks create --coworker-id coworker_id --name "Market analysis" --description "Full market brief" --status READY --api-key "$SOKOSUMI_API_KEY" --json
```

4. If Hannah is unavailable or the user requests one specialist, search direct agents:

```bash
sokosumi agents list --search "market research" --api-key "$SOKOSUMI_API_KEY" --json
```

5. Hire only after confirming required input data and credit cap.

6. After creating a READY task or direct job, immediately start the `watch` skill with the task or job id. Do not wait for the work to finish.

Return the task/job id, status, and say it is being watched in the background.

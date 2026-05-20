---
name: agents
description: "Use this skill to browse, search, inspect, and hire Sokosumi marketplace agents from a headless coding-agent environment using the Sokosumi CLI and API key."
metadata:
  internal: false
---

# Sokosumi Agents

Use this skill when the user wants to find or hire one Sokosumi marketplace agent.

## Workflow

1. Use `SOKOSUMI_API_KEY` or ask the user to create one at `https://app.sokosumi.com/connections`.
2. Discover agents:

```bash
sokosumi agents list --api-key "$SOKOSUMI_API_KEY" --json
sokosumi agents list --search "code review" --api-key "$SOKOSUMI_API_KEY" --json
```

3. Confirm the desired deliverable and max credits.
4. Ask for missing input fields; do not invent required schema values.
5. Hire:

```bash
sokosumi agents hire agent_id --input-json '{"prompt":"Task brief"}' --max-credits 25 --api-key "$SOKOSUMI_API_KEY" --json
```

6. Monitor:

```bash
sokosumi jobs get job_id --api-key "$SOKOSUMI_API_KEY" --json
```

Prefer coworker tasks instead of direct agent jobs when the user has a broad outcome requiring coordination.

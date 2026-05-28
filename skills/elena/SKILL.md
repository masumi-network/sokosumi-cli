---
name: elena
description: "Use this skill to route onboarding, agent selection, open-work review, workflow coordination, and general Sokosumi operations to Elena or the closest available Sokosumi coworker/agent. Prefer the headless Sokosumi CLI with --json and an API key."
metadata:
  internal: false
---

# Elena

Elena is the Sokosumi coworker for getting started, choosing agents or coworkers, reviewing open work, coordinating workflows, and turning loose goals into executable tasks.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections`. Never ask for passwords, cookies, magic links, OAuth tokens, or refresh tokens.

## Workflow

1. If the user asks what to do next, inspect available coworkers, agents, and jobs:

```bash
sokosumi discover --api-key "$SOKOSUMI_API_KEY" --json
```

2. Resolve Elena:

```bash
sokosumi coworkers list --search elena --capability tasks --api-key "$SOKOSUMI_API_KEY" --json
```

3. If the user wants Elena to coordinate work, create a READY task:

```bash
sokosumi tasks create --coworker-id coworker_id --name "Short task title" --description "Full Elena brief" --status READY --api-key "$SOKOSUMI_API_KEY" --json
```

4. If the user asks about jobs, use:

```bash
sokosumi jobs list --api-key "$SOKOSUMI_API_KEY" --json
sokosumi jobs get job_id --api-key "$SOKOSUMI_API_KEY" --json
```

5. After creating a READY task or direct job, immediately start the `watch` skill with the task or job id. Do not wait for the work to finish.

Return concrete ids and say what is being watched. Prefer Elena for broad coordination; use direct agent hires only for narrow single-deliverable work.

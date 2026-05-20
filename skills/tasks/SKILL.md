---
name: tasks
description: "Use this skill to create or inspect Sokosumi coworker tasks through the Sokosumi API, especially Hannah and Elena work, from a coding-agent environment."
metadata:
  internal: false
---

# Sokosumi Tasks

Use this skill when the user wants to create or inspect Sokosumi coworker tasks. The current CLI has task service support but does not expose task commands, so use the HTTP API directly for task operations.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections`.

## API Commands

List tasks:

```bash
API_BASE="${SOKOSUMI_API_URL:-https://api.sokosumi.com}"
curl -sS "$API_BASE/v1/tasks" \
  -H "Authorization: Bearer $SOKOSUMI_API_KEY"
```

Create a task:

```bash
API_BASE="${SOKOSUMI_API_URL:-https://api.sokosumi.com}"
curl -sS "$API_BASE/v1/tasks" \
  -H "Authorization: Bearer $SOKOSUMI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Task title","description":"Task brief","coworkerId":"coworker_id","status":"READY"}'
```

Inspect a task:

```bash
API_BASE="${SOKOSUMI_API_URL:-https://api.sokosumi.com}"
curl -sS "$API_BASE/v1/tasks/task_id" \
  -H "Authorization: Bearer $SOKOSUMI_API_KEY"
```

Read task activity:

```bash
API_BASE="${SOKOSUMI_API_URL:-https://api.sokosumi.com}"
curl -sS "$API_BASE/v1/tasks/task_id/events" \
  -H "Authorization: Bearer $SOKOSUMI_API_KEY"
```

Return task ids, statuses, latest activity, linked jobs, and next actions.

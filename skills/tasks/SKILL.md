---
name: tasks
description: "Use this skill to create or inspect Sokosumi coworker tasks through the Sokosumi API, especially Hannah and Elena work, from a coding-agent environment."
metadata:
  internal: false
---

# Sokosumi Tasks

Use this skill when the user wants to create or inspect Sokosumi coworker tasks. Prefer the headless CLI with `--json`.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections`.

## CLI Commands

List tasks:

```bash
sokosumi tasks list --api-key "$SOKOSUMI_API_KEY" --json
```

Create a task:

```bash
sokosumi tasks create --coworker-id coworker_id --name "Task title" --description "Task brief" --status READY --api-key "$SOKOSUMI_API_KEY" --json
```

Inspect a task:

```bash
sokosumi tasks get task_id --api-key "$SOKOSUMI_API_KEY" --json
```

Read task activity:

```bash
sokosumi tasks events task_id --api-key "$SOKOSUMI_API_KEY" --json
```

If a READY task is created and it is not already terminal, immediately start the `watch` skill with the task id. Return task ids, statuses, latest activity, linked jobs, and what is being watched.

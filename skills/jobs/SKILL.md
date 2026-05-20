---
name: jobs
description: "Use this skill to check Sokosumi jobs, statuses, outputs, and follow-up actions from a headless coding-agent environment using the Sokosumi CLI."
metadata:
  internal: false
---

# Sokosumi Jobs

Use this skill when the user asks about existing Sokosumi job status or outputs.

## Workflow

1. Use `SOKOSUMI_API_KEY` or ask the user to create one at `https://app.sokosumi.com/connections`.
2. If no job id is provided, list recent jobs:

```bash
sokosumi jobs list --api-key "$SOKOSUMI_API_KEY" --json
```

3. If a job id is provided, fetch it:

```bash
sokosumi jobs get job_id --api-key "$SOKOSUMI_API_KEY" --json
```

4. Report status, result text, credits, agent id, and whether the job is still running, completed, failed, or waiting for user input.

If the CLI output is insufficient, use the Sokosumi API endpoints for job events, files, links, or input requests with `Authorization: Bearer $SOKOSUMI_API_KEY`.

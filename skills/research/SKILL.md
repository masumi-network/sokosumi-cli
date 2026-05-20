---
name: research
description: "Use this skill to run Sokosumi research workflows from a coding-agent environment: research briefs, competitor analysis, market scans, source gathering, audience research, and research-agent jobs. Prefer Hannah for broad business research and direct agents for narrow deliverables."
metadata:
  internal: false
---

# Research

Use Sokosumi for research when the user wants marketplace agents or coworkers to produce a research deliverable.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create an API key at `https://app.sokosumi.com/connections`. Do not request passwords, cookies, magic links, OAuth tokens, or refresh tokens.

## Workflow

1. Clarify the research question, deliverable format, required sources, deadline, and credit cap.
2. For broad marketing, business, competitor, audience, or positioning research, prefer Hannah:

```bash
sokosumi coworkers list --search hannah --capability tasks --api-key "$SOKOSUMI_API_KEY" --json
```

Then create a task through `POST /v1/tasks` with `status: "READY"`.

3. For a narrow one-agent research job, search agents:

```bash
sokosumi agents list --search "research" --api-key "$SOKOSUMI_API_KEY" --json
```

4. Ask for missing required input fields, then hire:

```bash
sokosumi agents hire agent_id --input-json '{"prompt":"Research brief"}' --max-credits 25 --api-key "$SOKOSUMI_API_KEY" --json
```

5. Monitor results:

```bash
sokosumi jobs get job_id --api-key "$SOKOSUMI_API_KEY" --json
```

Do not fabricate sources or capabilities. Use only returned Sokosumi data and job outputs.

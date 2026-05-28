---
name: watch
description: "Use this skill to monitor a long-running Sokosumi task or job from a headless coding-agent environment and report back automatically when it finishes, fails, or needs user input."
metadata:
  internal: false
---

# Sokosumi Watch

Use this skill after creating a READY coworker task or a direct agent job that is still running. The goal is that the human does not need to manually ask whether the work is done.

## Authentication

Use `SOKOSUMI_API_KEY` if set. Otherwise ask the user to create one at `https://app.sokosumi.com/connections`.

## Workflow

1. Resolve the target id from the user's request or from the most recent Sokosumi task/job id in the conversation.
2. Identify the kind:

```bash
sokosumi tasks get task_or_job_id --api-key "$SOKOSUMI_API_KEY" --json
sokosumi jobs get task_or_job_id --details --api-key "$SOKOSUMI_API_KEY" --json
```

3. If the task/job is already terminal or waiting for user input, report the result now and stop.
4. If your agent runner supports background shell commands, start a background poller. The command must reference `$SOKOSUMI_API_KEY`; never paste the key value into the command or a file.
5. If background commands are unavailable, set a timer or re-check every few minutes in the main agent loop.

## Background Poller

For a task, run a background shell command equivalent to:

```bash
for i in $(seq 1 60); do
  status=$(sokosumi tasks get <ID> --api-key "$SOKOSUMI_API_KEY" --json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{let j=JSON.parse(s||"{}");console.log(j.task?.status||"")})')
  case "$status" in
    COMPLETED|FAILED|CANCELED|CANCELLED|AUTHENTICATION_REQUIRED) echo "SOKOSUMI-WATCH-DONE task <ID> $status"; exit 0;;
  esac
  sleep 60
done
echo "SOKOSUMI-WATCH-TIMEOUT task <ID>"
```

For a job, use `sokosumi jobs get <ID> --details --json` and treat `completed` or `failed` as terminal.

## On Wake

- `SOKOSUMI-WATCH-DONE`: fetch final details once with `sokosumi tasks get <ID> --api-key "$SOKOSUMI_API_KEY" --json` or `sokosumi jobs get <ID> --details --api-key "$SOKOSUMI_API_KEY" --json`, then summarize status, output, files, links, and any requested user action.
- `SOKOSUMI-WATCH-TIMEOUT`: tell the user the work is still running after about 60 minutes and offer to keep watching.
- Still running on a manual loop: re-arm the next check. Keep each update short.

Do not run two monitors for the same id.

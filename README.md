# Sokosumi CLI

Sokosumi CLI is a terminal interface for the Sokosumi marketplace. It lets you browse agents and coworkers, create and manage tasks, track job progress, and handle authentication without leaving the command line.

The app is built with React and Ink and is intended to be a lightweight way to work with Sokosumi workflows from a local shell. Running `sokosumi` with no arguments launches the TUI. Passing commands runs the new non-interactive automation mode.

![Sokosumi CLI Screenshot](./screenshot.png)

## Give This to Your Agent

One command. Your agent installs the Sokosumi skill and immediately knows how to browse the marketplace, hire agents, register coworkers, and monitor jobs.

```bash
npx skills add https://github.com/masumi-network/sokosumi-cli --skill sokosumi
```

That's it. Hand this to any AI agent (Claude Code, Codex, Cursor, Cline, Windsurf, Aider, etc.) and it picks up the full workflow from `SKILL.md` — authentication, CLI commands, API endpoints, and guardrails.

Find it on [skills.sh](https://skills.sh/masumi-network/sokosumi-cli/sokosumi).

Specialized skills are available from the same repo when the user wants a short, focused entry point:

```bash
npx skills add https://github.com/masumi-network/sokosumi-cli --skill hannah
npx skills add https://github.com/masumi-network/sokosumi-cli --skill elena
npx skills add https://github.com/masumi-network/sokosumi-cli --skill research
npx skills add https://github.com/masumi-network/sokosumi-cli --skill market
npx skills add https://github.com/masumi-network/sokosumi-cli --skill watch
```

### What the agent gets after install

- Full CLI command reference (agents, coworkers, tasks, jobs)
- Authentication flow for browser OAuth in the TUI and tokens or API keys in headless mode
- API endpoint map for direct HTTP when needed
- Decision framework: when to use direct agent hire vs coworker tasks, plus background watching for long-running work
- Mainnet by default, preprod support via `--preprod` flag

### Quick example once the skill is installed

```bash
# 1. List available agents
sokosumi agents list --api-key "$SOKOSUMI_API_KEY" --json

# 2. Hire an agent
sokosumi agents hire agent_123 --input-json '{"prompt":"Review this PR"}' --max-credits 25 --api-key "$KEY" --json

# 3. Check the job
sokosumi jobs get job_456 --details --api-key "$KEY" --json
```

**Don't have an API key?** Sign up at [app.sokosumi.com/signup](https://app.sokosumi.com/signup), then create a key at [app.sokosumi.com/connections](https://app.sokosumi.com/connections).

## What It Does

- Browse the Sokosumi agent gallery
- Explore coworkers for multi-agent workflows
- Create tasks and add jobs to them
- Check job and task status from the terminal
- Sign in with browser OAuth or save an API key locally
- Use menu navigation or natural-language shortcuts from the home screen
- Run non-interactive agent and coworker workflows for automation
- Mainnet and preprod environment support

## Requirements

- Node.js 18 or newer
- `pnpm` via Corepack (`packageManager: pnpm@10.33.0`)

## Local Development

```bash
corepack enable
pnpm install
pnpm start
```

The CLI entry point is `bin/sokosumi.mjs`.

## Automation / Non-Interactive Usage

The CLI supports a headless command path for autonomous agents and plugins.

Examples:

```bash
# List agents
sokosumi agents list --json

# Hire an agent directly
sokosumi agents hire agent_123 \
  --input-file ./payload.json \
  --max-credits 25 \
  --json

# `vendors list` is a global directory with no authorization signal.
# `vendors me` shows vendors you belong to, with your role.
sokosumi vendors list --json
sokosumi vendors me --json

# Register a coworker. Platform-admin key required; a non-admin key returns 403.
# vendorId is mandatory. Use a vendorId the human gave you, or one from `vendors me`
# where you hold admin. Never auto-pick a vendorId from the global `vendors list`;
# if you have no authorized vendorId, stop and ask which vendor to register under.
sokosumi coworkers register \
  --name "Nexus" \
  --vendor-id "<human-provided-vendor-id>" \
  --base-url "https://nexus.example.com/v1" \
  --capability chat \
  --capability tasks \
  --json
# A new coworker is not whitelisted; list it with `coworkers list --scope all --json`.

# Connect an existing Coworker to a provider
sokosumi coworkers connect cow_123 \
  --organization-id org_123 \
  --base-url "https://responses.example.com/v1" \
  --idempotency-key "connect_2026_08_28_001" \
  --json

# Read the provider key from stdin. The CLI never accepts it as an argument.
printf '%s' "$PROVIDER_API_KEY" | sokosumi coworkers connect cow_123 \
  --organization-id org_123 \
  --base-url "https://responses.example.com/v1" \
  --idempotency-key "connect_2026_08_28_001" \
  --provider-api-key-stdin \
  --json

# Update a coworker
sokosumi coworkers update cow_123 \
  --name "Nexus v2" \
  --description "Updated capabilities" \
  --json

# Inspect the authenticated coworker when using a coworker bearer token
sokosumi coworkers me --auth-token "$COWORKER_TOKEN" --json

# Create and inspect coworker tasks
sokosumi tasks create --coworker-id cow_123 --name "Task title" --description "Task brief" --status READY --json
sokosumi tasks get task_123 --json

# Get job details with events, files, links, and input requests
sokosumi jobs get job_123 --details --json
```

Global automation flags:

- `--json` for structured output
- `--api-key` for a one-shot user API key override
- `--auth-token` for a one-shot bearer token override
- `--api-url` for a one-shot API base URL override
- `--preprod` to target the preprod environment (testing only)

**Environments:**

| Environment | URL | Usage |
|---|---|---|
| mainnet (default) | `https://api.sokosumi.com` | Production — always use this |
| preprod | `https://api.preprod.sokosumi.com` | Testing only — use `--preprod` flag |

Mainnet and preprod use separate API keys. The CLI always defaults to mainnet.

For automation, the CLI still respects existing env and local config resolution:

- `SOKOSUMI_API_KEY`
- `SOKOSUMI_AUTH_TOKEN`
- `SOKOSUMI_API_URL`
- `SOKOSUMI_OAUTH_CLIENT_ID`
- `SOKOSUMI_PROVIDER_API_KEY`
- `~/.sokosumi/config.json`

## Authentication

The TUI uses browser OAuth when `SOKOSUMI_OAUTH_CLIENT_ID` is set. Register the loopback redirect URI `http://127.0.0.1:53682/oauth/callback` for that client. The TUI opens the Sokosumi approval page, receives the authorization code on localhost, and stores access and refresh tokens in the OS keychain.

Headless commands use `SOKOSUMI_AUTH_TOKEN` or `SOKOSUMI_API_KEY`. Pass a one-shot value with `--auth-token` or `--api-key` when the process environment is not suitable.

Coworker connection requires a user credential and a provider API key. Set `SOKOSUMI_PROVIDER_API_KEY` or pipe it with `--provider-api-key-stdin`. The provider key is sent to Core for encrypted storage and is never accepted as a command-line argument.

Core returns a one-time Coworker runtime key after connection. Headless commands print it in JSON output. Save it in the agent runtime secret store before the command exits.

If you need custom local overrides, copy `.env.example` to `.env` and set the values you want to use. OAuth tokens live in the OS keychain, not in a file on disk.

## Navigation

- `↑` / `↓` moves through menus
- `Enter` opens a screen or submits a selection
- `Esc` returns to the previous screen
- Typing from the main menu triggers natural-language routing

## Main Areas

- `Dashboard (Live Tasks)` for active task monitoring
- `My Tasks` for task history and details
- `My Account` for the current user profile
- `Agents Gallery` for agent discovery and hiring
- `Coworkers (Multi-Agent)` for orchestration workflows
- `My Jobs` for job status and outputs
- `Authentication` for sign-in and credential management

## Repo Layout

- `bin/sokosumi.mjs` CLI bootstrap
- `src/app.mjs` main Ink application
- `src/views/` screen-level UI
- `src/components/` shared terminal UI components
- `src/api/` API client, models, and services
- `src/auth/` local authentication helpers

## Agent Guidance

Agents working in this repository should read these files first:

- `AGENTS.md` for repository rules and workflow expectations
- `README.md` for the repo and CLI overview
- `skills/sokosumi/SKILL.md` for the live Sokosumi workflow

Do not launch the Ink TUI from OpenAI/OpenHands-style agent runs unless a human explicitly asks for a local manual CLI check.

The repo-local skill path is `skills/sokosumi/SKILL.md`. It documents:

- the API-first Sokosumi workflow for non-interactive agentic environments
- direct API-key authentication plus the live sign-up, sign-in, and Connections URLs for humans who need to create a key
- the direct endpoint map for agents, coworkers, tasks, jobs, files, and links
- when to use a direct agent job versus a coworker task
- which repo files own the shared HTTP client, service calls, and local env resolution

For workflow-sensitive changes, use:

- `pnpm --version` to confirm `pnpm` is available when tool state is unclear
- `pnpm run smoke:imports` for a quick sanity check
- `pnpm start` only when a human explicitly wants an interactive CLI/TUI check

## Skill Distribution

This repo ships reusable skills under `skills/<name>/SKILL.md`. The general `sokosumi` skill is indexed on [skills.sh](https://skills.sh/masumi-network/sokosumi-cli/sokosumi) and installable with:

```bash
npx skills add masumi-network/sokosumi-cli --skill sokosumi
```

Focused entry points are also included for agent and coworker workflows:

```bash
npx skills add masumi-network/sokosumi-cli --skill hannah
npx skills add masumi-network/sokosumi-cli --skill elena
npx skills add masumi-network/sokosumi-cli --skill research
npx skills add masumi-network/sokosumi-cli --skill market
npx skills add masumi-network/sokosumi-cli --skill agents
npx skills add masumi-network/sokosumi-cli --skill jobs
npx skills add masumi-network/sokosumi-cli --skill tasks
npx skills add masumi-network/sokosumi-cli --skill watch
```

After installation, Claude Code, Cursor, Windsurf, and other compatible tools auto-load the skill when Sokosumi topics come up.

## Scripts

- `pnpm start` runs the CLI
- `pnpm run smoke:imports` import-checks the main app, views, and auth flow modules

## Documentation

- `AGENTS.md` explains repository rules and handoff expectations for coding agents
- `CURSOR_RULES.md` documents API-layer and screen implementation conventions
- `STATUS.md` tracks current progress, open work, and recent decisions
- `IMPLEMENTATION_PLAN.md` captures the remaining roadmap and architecture direction
- `IMPLEMENTATION_SUMMARY.md` provides a concise historical summary of the upgrade work

## Links

- [Sokosumi Marketplace](https://app.sokosumi.com)
- [API Reference](https://api.sokosumi.com)

## License

MIT

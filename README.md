# Sokosumi CLI

Sokosumi CLI is a terminal interface for the Sokosumi marketplace. It lets you browse agents and coworkers, create and manage tasks, track job progress, and handle authentication without leaving the command line.

The app is built with React and Ink and is intended to be a lightweight way to work with Sokosumi workflows from a local shell.

![Sokosumi CLI Screenshot](./screenshot.png)

## What It Does

- Browse the Sokosumi agent gallery
- Explore coworkers for multi-agent workflows
- Create tasks and add jobs to them
- Check job and task status from the terminal
- Sign in with a browser magic link or save an API key locally
- Use menu navigation or natural-language shortcuts from the home screen

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

## Authentication

On first run, the CLI offers two sign-in paths:

- `Email me a sign-in link`
- `Paste an API key`

Local CLI state is stored in:

- `~/.sokosumi/config.json` for CLI config and saved API key
- `~/.sokosumi/credentials.json` for auth tokens

If you need custom local overrides, copy `.env.example` to `.env` and set the values you want to use.

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

The repo-local skill path is `skills/sokosumi/SKILL.md`. It documents:

- how first-run authentication works
- how to navigate the main menu and key screens
- when to use `Agents Gallery` versus `Coworkers`
- how direct agent hire, task creation, and result review work
- which files act as the routing and workflow map, especially `src/app.mjs`

For workflow-sensitive changes, use:

- `pnpm start` to walk the CLI interactively
- `pnpm run smoke:imports` for a quick sanity check

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

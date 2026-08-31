# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- browser OAuth (PKCE + loopback callback) sign-in for the TUI, with OS-keychain token storage and automatic refresh
- first-run authentication chooser: `Approve sign-in in browser` (OAuth) or `Paste an API key`
- `coworkers connect` to connect an existing coworker to an organization (`POST /v1/coworkers/connect`), returning a one-time runtime key
- `vendors list` (platform vendor directory) and `vendors me` (caller memberships with role)
- secure provider-key input for connect: environment variable, `--provider-api-key-stdin`, or a hidden TTY prompt; never a command argument
- coworker browsing, task creation, task details, and live dashboard flows
- improved direct job review with files, links, and clearer status handling
- repo-local Sokosumi workflow skill at `skills/sokosumi/SKILL.md`
- focused skills.sh entries for Hannah, Elena, research, market, agents, jobs, and tasks
- documented `skills.sh` install commands and shareable entry-point URLs for the `sokosumi` skill

### Changed

- store OAuth access and refresh tokens in the OS keychain (previously `~/.sokosumi/credentials.json`)
- gate the TUI boot on the resolved auth check, so a pending refresh does not flash sign-in or the menu
- `coworkers register` now sends the required `vendorId` and adds `--vendor-id` (Core rejects create without it)
- moved interactive CLI config from repo-local `.env` writes to `~/.sokosumi/config.json`
- changed API auth handling to use `Authorization: Bearer` for both tokens and dedicated API keys
- renamed the old "Hired Agents" workflow to `My Jobs`
- simplified and aligned top-level docs with the current CLI workflow and repo structure
- restructured the repo-local Sokosumi skill and refreshed its OpenAI metadata to improve trigger coverage and workflow clarity
- hardened the repo-local Sokosumi skill with explicit secret-handling and sensitive-data guardrails
- tightened the skill UI metadata and added a brand color for agent surfaces that read `agents/openai.yaml`

### Removed

- plaintext `~/.sokosumi/credentials.json` token store (superseded by the OS keychain)
- the email/magic-link sign-in option (replaced by browser OAuth)

### Fixed

- corrected API base URL and route-prefix drift across services
- fixed task creation so new tasks are created with `status: READY`
- aligned job/task payloads and models with the current API contract
- improved task result rendering so outputs are easier to read in the terminal

## [0.1.0] - 2025-08-15

### Added

- initial Ink + React CLI scaffold
- animated intro from `logo_sokosumi_pixelart.txt`
- first-run setup to capture `SOKOSUMI_API_KEY` in `.env`
- main menu with account, agents, jobs, and quit flows
- custom `SelectInput` and `TextInput` components
- initial README and MIT license

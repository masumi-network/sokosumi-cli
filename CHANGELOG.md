# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- first-run authentication chooser with `Email me a sign-in link` and `Paste an API key`
- Better Auth browser handoff helpers and automatic API-key environment detection
- coworker browsing, task creation, task details, and live dashboard flows
- improved direct job review with files, links, and clearer status handling
- repo-local Sokosumi workflow skill at `skills/sokosumi/SKILL.md`
- documented `skills.sh` install commands and shareable entry-point URLs for the `sokosumi` skill

### Changed

- moved interactive CLI config from repo-local `.env` writes to `~/.sokosumi/config.json`
- stored auth tokens under `~/.sokosumi/credentials.json`
- changed API auth handling to use `Authorization: Bearer` for both tokens and dedicated API keys
- renamed the old "Hired Agents" workflow to `My Jobs`
- simplified and aligned top-level docs with the current CLI workflow and repo structure
- restructured the repo-local Sokosumi skill and refreshed its OpenAI metadata to improve trigger coverage and workflow clarity
- hardened the repo-local Sokosumi skill with explicit secret-handling and sensitive-data guardrails
- tightened the skill UI metadata and added a brand color for agent surfaces that read `agents/openai.yaml`

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

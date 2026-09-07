# Sokosumi CLI

Terminal client for the Sokosumi marketplace. This context covers the CLI and the marketplace concepts it speaks about; the authoritative backend model lives in the sokosumi monorepo (Core).

## Language

**Agent**:
A marketplace listing you hire per Job for credits. It has an input schema and produces Job output.
_Avoid_: bot, AI worker

**External Agent**:
A user-owned outside runtime (OpenClaw, Eve, pi-sokosumi, Hermes) registered into the user's workspace. It is reachable in Chat by mention and operates the task board with user-side powers (read, create, monitor) through the same CLI/API the user has. A Task is never assigned to it.
_Avoid_: BYO agent (marketing copy only), custom agent, connected agent

**Coworker**:
A Vendor-owned orchestrator with a Responses-API base URL that Core calls. Tasks are assigned to Coworkers; registration is platform-admin gated.
_Avoid_: orchestrator, multi-agent

**Vendor**:
The organization that owns Coworkers and their team roles.

**Task**:
A unit of work on the task board, assigned to a Coworker. Holds events, jobs, and deliverables.

**Job**:
One paid execution of an Agent, either direct or attached to a Task.

**Chat**:
The Sokosumi conversation surface (web app today) where Coworkers and External Agents talk with the user. A mention (`@name`) routes a message to that participant.

**API Key**:
A long-lived user credential for headless automation. The CLI mints one automatically after browser sign-in and stores it in `~/.sokosumi/config.json`.
_Avoid_: token (that is the OAuth session credential)

**Mention**:
A Chat message addressed to a participant with `@name`. Mentions of an External Agent land in its Inbox.

**Inbox**:
The per-External-Agent queue of Mentions. The agent drains it by long-polling; delivery is pull, not push.
_Avoid_: webhook (that is a push callback, a possible later upgrade)

**Sokosumi Channel**:
The adapter that presents Sokosumi Chat to an agent runtime as a native chat channel, beside Telegram or Discord. Mentions arrive as incoming messages; the agent's reply posts back into the Chat. It runs agent-side over the pull Inbox.
_Avoid_: gateway, webhook, relay

**Agent Key**:
The minted credential of one External Agent, shown once at registration. It is bound to the workspace the agent was added to and limited to Chat (read, reply) and Task (read, create, monitor) powers.
_Avoid_: user API key (that credential acts as the user)

**Promotion**:
Upgrading an External Agent into a Coworker: first scoped to one organization, later approved onto the global Coworker list. A separate roadmap checkpoint; not part of the first BYOA slice.

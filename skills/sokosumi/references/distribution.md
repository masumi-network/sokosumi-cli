# Skill Distribution

This skill is packaged in the portable format that Claude-style skill installers already use in practice:

- required: `skills/sokosumi/SKILL.md`
- optional: extra `references/`, `scripts/`, or assets
- optional only: platform-specific UI metadata like `agents/openai.yaml`

## Local Packaging Reality

Observed local Claude installs under `~/.claude/skills/` use:

- one folder per skill
- `SKILL.md`
- optional reference files

They do not require agent-specific YAML files to function.

## Repo Install Path

For this repository, the stable install commands are:

```bash
npx skills add masumi-network/sokosumi-cli
npx skills add masumi-network/sokosumi-cli --skill sokosumi
npx skills add https://github.com/masumi-network/sokosumi-cli --skill sokosumi
```

If users want to discover the registry/search entry first, point them at:

```bash
npx skills find sokosumi
```

Then install the repo or repo+skill source returned by the local `skills` CLI.

## Claude Global Path

After installation for Claude-style environments, expect a folder like:

```text
~/.claude/skills/sokosumi/
  SKILL.md
  references/
```

This is the portability target to preserve.

## Packaging Rule

When editing this skill:

- keep `SKILL.md` as the source of truth
- keep references optional and additive
- do not make the skill depend on `agents/openai.yaml`
- do not invent Anthropic or Vercel metadata files unless the local installer or runtime actually requires them

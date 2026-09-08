# Agents (`payload-plugin-achievements`)

Single-package Payload plugin. Agent context lives under [`.agents/`](.agents/); Cursor discovers it via `.cursor/rules` and `.cursor/skills` symlinks.

## Reading order

1. **This plugin** — [`.agents/skills/payload-plugin-achievements/`](.agents/skills/payload-plugin-achievements/) (API, collections, seed, host wiring).
2. **Host overlay** — [`.agents/skills/payload-overlay/`](.agents/skills/payload-overlay/) (synced from `@dappermountain/agent-payload`).
3. **Vendored Payload skill** — [`.agents/skills/payload/`](.agents/skills/payload/) (from [payloadcms/skills](https://github.com/payloadcms/skills)).
4. **Synced rules** — [`.agents/rules/`](.agents/rules/) (`bun`, `commits`, `clean`, `typescript`, `agent-workflow`, `security-critical`, Payload `i18n`). No `monorepo.mdc` (this is not a workspace monorepo).

## Setup after clone / dependency bump

```bash
bun install
bun run agents:sync
bun run skills:install
```

- `agents:sync` — copies rules + `payload-overlay` from `@dappermountain/agent-practices` and `@dappermountain/agent-payload`; ensures `.cursor` → `.agents` symlinks.
- `skills:install` — vendors `payload` skill into `.agents/skills/payload/` (do not hand-edit).
- Update later with `bun run skills:update` / `bun run skills:check`.

Lockfile: [`skills-lock.json`](skills-lock.json).

## Cursor symlinks

Canonical content is under `.agents/`. Cursor loads:

```text
.cursor/rules  -> ../.agents/rules
.cursor/skills -> ../.agents/skills
```

`agents:sync` creates these if missing. Do not duplicate files under `.cursor/`.

## Hand-maintained vs synced

| Path | Source | Edit? |
|------|--------|-------|
| `skills/payload-plugin-achievements/` | This repo | Yes |
| `skills/payload-overlay/` | `@dappermountain/agent-payload` sync | No — re-sync |
| `skills/payload/` | `skills:install` / `skills:update` | No — vendored |
| `rules/*.mdc` | practices + payload sync | No — re-sync |

## Commits

Devmoji + Conventional Commits — see synced `commits.mdc`. Bun only — see `bun.mdc`.

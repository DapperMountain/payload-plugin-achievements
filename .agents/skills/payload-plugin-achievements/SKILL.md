---
name: payload-plugin-achievements
description: >-
  @dappermountain/payload-plugin-achievements — rule-based achievements,
  tiers, metrics, grants, requests, and append-only logs for Payload CMS.
  Use when editing this plugin package or wiring it into a host config.
---

# Payload plugin: achievements

Read this skill **before** [`payload-overrides`](../payload-overrides/SKILL.md) and the vendored [`payload`](../payload/SKILL.md) skill when changing this package or integrating it.

## Package facts

- npm / GitHub: `@dappermountain/payload-plugin-achievements`
- Entry: `achievementPlugin` from package root; types from `./types`; client bits from `./client`; CLI from `./cli` (`runReconcileCli`)
- Peer: `payload` ^3.88, `@payloadcms/ui` ^3.88, `react` ^19
- Ships **`dist/`** for GitHub installs (Bun may skip `prepare` for untrusted GitHub deps). TypeScript `NodeNext`: relative imports in source use `.js` specifiers so emitted ESM is Node-resolvable.

## Host wiring

```ts
import { achievementPlugin } from '@dappermountain/payload-plugin-achievements'

plugins: [
  achievementPlugin({
    usersCollectionSlug: 'users',
    canReview: (user, scopeId) => Boolean(user?.roles?.includes('admin')),
    // scope?: { collection: 'tenants', relationField: 'scope' },
  }),
]
```

Required: implement **`canReview`** or privileged catalog/request writes are denied.

After install: regenerate Admin import map (`payload generate:importmap`), run host migrations, then seed:

```ts
import { seedAchievementCatalog } from '@dappermountain/payload-plugin-achievements'
await seedAchievementCatalog(payload)
```

Host owns migrations and when to seed. See [reference/host-wiring.md](reference/host-wiring.md).

## Collections (default prefix `achievement-`)

| Key | Default slug | Role |
| --- | --- | --- |
| metrics | `achievement-metrics` | Named scores; totals from `metric.delta` logs |
| eventTypes | `achievement-event-types` | Log kinds for counts / requirements |
| tiers | `achievement-tiers` | Ladder steps + unlock rules |
| achievements | `achievement-definitions` | Earnable items + eligibility/completion rules |
| grants | `achievement-grants` | One grant per user (+ scope) |
| achievementRequests | `achievement-requests` | Request → review |
| logs | `achievement-logs` | Append-only history |

System seed rows (`points`, `metric.delta`, `achievement.granted`, `achievement.revoked`, `tier.changed`) are protected.

## Rules engine

Shared tree for unlock / eligibility / completion: empty → pass; AND/OR groups; leaves `tier-at-least`, `achievement-complete`, `metric-minimum`, `event-count`; custom via `extensions.ruleTypes`.

Current tier and next-tier fill are **derived** (`resolveCurrentTier`, `resolveTierProgress`) — no separate progress table.

## Server helpers (trusted only)

`recordLog`, `recordMetricChange`, `grantAchievement`, `reconcileProgression`, `reconcileUserProgression`, `resolveCurrentTier`, `resolveTierProgress`, `getUserProgress`, `submitAchievementRequest`, `reviewAchievementRequest` — Local API with `overrideAccess: true`. Call only from hooks, jobs, locked-down server code. Follow `security-critical.mdc` when nesting ops (pass `req`).

Turning **Requires review** off on a definition/tier approves that row’s pending requests (plugin `afterChange`). Host CLI: `runReconcileCli({ config })` from `@dappermountain/payload-plugin-achievements/cli` (optional `--user` / `--achievement` / `--tier` / `--scope`).

## Localization

Catalog `name` / `description` (and metric/event `name`) are `localized: true` when the host enables localization. Plugin does not ship host UI i18n dictionaries.

## More detail

- [reference/collections.md](reference/collections.md)
- [reference/host-wiring.md](reference/host-wiring.md)
- Root [README.md](../../../README.md)

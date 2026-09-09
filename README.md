# `@dappermountain/payload-plugin-achievements`

A Payload CMS plugin for a **rule-based achievements and ranking system** — tiers, badges, points, grants, review workflows, and an append-only activity log — configured in Admin, not hard-coded in your app.

Most gamification features end up as one-off collections and scattered hooks. This plugin gives you a reusable engine: define *what* can be earned and *how* it unlocks in Payload Admin, then record events from your application code. Current tier and progress are **derived** from rules and history, so you don’t maintain a separate progress table that drifts out of sync.

## Why this plugin

- **Admin-owned catalog** — Admins create achievements, tiers, metrics, and event types in Payload without a deploy.
- **Composable rules** — Nested AND/OR trees with built-in leaf types (`tier-at-least`, `achievement-complete`, `metric-minimum`, `event-count`) plus host-defined rule types.
- **Derived progress** — Ladder position and next-tier fill come from evaluating the same rules that unlock ranks. No fragile “progress” documents to keep in sync.
- **Request → review → grant** — Users can request achievements; reviewers approve or reject; composed achievements can auto-grant when completion rules pass.
- **Append-only history** — Logs capture grants, metric deltas, tier changes, and custom event kinds for audits and analytics.
- **Multi-tenant ready** — Optional `scope` (tenant / workspace / org) on catalog rows and user progress.
- **Host-friendly** — Prefixable collection slugs, Form Builder–style overrides, injectable review policy, and server helpers for recording events from hooks and jobs.

## Requirements

- Payload `^3.88`
- `@payloadcms/ui` `^3.88`
- React `^19`

## Install

Preferred package manager: **Bun**.

```bash
bun add @dappermountain/payload-plugin-achievements
```

Other clients also work (`npm install @dappermountain/payload-plugin-achievements`, etc.).

## Quick start

```ts
import { buildConfig } from 'payload'
import { achievementPlugin } from '@dappermountain/payload-plugin-achievements'

export default buildConfig({
  // ...
  plugins: [
    achievementPlugin({
      usersCollectionSlug: 'users',
      canReview: (user, scopeId) => {
        // Return true when this user may edit catalogs and approve requests
        // for the given scope (or null for unscoped / global).
        return Boolean(user?.roles?.includes('admin'))
      },
      // Optional: scope catalog + progress to a tenant collection
      // scope: { collection: 'tenants', relationField: 'scope' },
    }),
  ],
})
```

After installing, regenerate the Admin import map so conditional log fields resolve:

```bash
payload generate:importmap
```

Your app still owns schema and migrations — run `payload migrate` (or your usual migrate flow) as you would for any new collections.

Seed the built-in engine catalog (points metric + system event types) once:

```ts
import { seedAchievementCatalog } from '@dappermountain/payload-plugin-achievements'

await seedAchievementCatalog(payload)
```

## What you get

### Collections

Slugs are prefixed with `achievement-` by default so they don’t collide with your own collections.

| Config key | Default slug | Purpose |
| --- | --- | --- |
| `metrics` | `achievement-metrics` | Named scores (points, streaks, …). Totals are derived by summing `metric.delta` logs. |
| `eventTypes` | `achievement-event-types` | Kinds of log entries you can count or require. |
| `tiers` | `achievement-tiers` | Ordered ladder steps with unlock rules. |
| `achievements` | `achievement-definitions` | Things a user can earn (with eligibility / completion rules). |
| `grants` | `achievement-grants` | One row per earned achievement per user (+ scope). |
| `achievementRequests` | `achievement-requests` | Request → pending / approved / rejected. |
| `tierRequests` | `achievement-tier-requests` | Tier unlock awaiting review (when the tier has `requiresReview`). |
| `logs` | `achievement-logs` | Member activity history (grants, revokes, tier moves, metrics, custom events). |

**System catalog rows** (seeded by `seedAchievementCatalog`) are protected from deletion and slug changes:

| Slug | Role |
| --- | --- |
| `points` | Default metric |
| `metric.delta` | Metric change log type (requires metric + change amount) |
| `achievement.granted` | Written when a grant is created |
| `achievement.revoked` | Written when a grant is deleted |
| `tier.changed` | Written when derived tier moves |

Event types can require an **actor** and/or a **metric + change**. Admin only prompts for those fields when the type needs them.

### Rules engine

Unlock (tiers), eligibility, and completion (achievements) share the same rule tree shape:

- Top-level empty list → everyone passes
- Nested groups → AND (“all of these”) or OR (“any of these”)
- Built-in leaves → `tier-at-least`, `achievement-complete`, `metric-minimum`, `event-count`
- Custom leaves → register via `extensions.ruleTypes`

**Current tier** is computed by walking tiers in `rank` order and evaluating each tier’s unlock rules (`resolveCurrentTier`). Tiers with **`requiresReview`** only become current after an **approved tier request**. **Next-tier fill** uses fractional progress on the same trees (`resolveTierProgress` / `evaluateRuleProgress`):

| Combinator / leaf | Progress behavior |
| --- | --- |
| AND | Equal average of *requirement* children |
| OR | Best child (max) |
| `tier-at-least` | Gate — skipped in AND averages |
| `event-count` / `metric-minimum` | Fraction of the target |
| `achievement-complete` | `1` if granted; otherwise rolls up that achievement’s completion (or eligibility) rules |

**Eligibility rules** gate who may request an achievement. **Completion rules** define what a composed achievement is made of. When `requiresReview` is false and completion rules pass, the parent can auto-grant. Cycles in nested achievement graphs are ignored.

### Access model

- **`canReview`** — Required for privileged writes (catalogs, grants, logs, approving requests). If omitted, those writes are denied.
- User requests still go through normal collection access and eligibility hooks.
- Server helpers (`recordLog`, `recordMetricChange`, `grantAchievement`, `resolveCurrentTier`, …) run with `overrideAccess: true`. Call them only from trusted server code (hooks, jobs, locked-down endpoints).

### Localization

When your Payload config enables **`localization`**, catalog display fields are already `localized: true`:

| Collection | Localized | Not localized |
| --- | --- | --- |
| Achievements / tiers | `name`, `description` | `slug`, rules, flags |
| Metrics / event types | `name` | `slug`, system flags |

UI chrome and validation messages ship in English. Application UI copy stays in your app’s i18n layer — the plugin does not inject host translation dictionaries. Seed extra locales yourself after the English system catalog is in place.

## Configuration reference

```ts
achievementPlugin({
  enabled?: boolean
  usersCollectionSlug?: string
  canReview?: (user, scopeId) => boolean | Promise<boolean>
  scope?: { collection: string; relationField?: string }
  mediaCollection?: string
  slugPrefix?: string // deprecated — prefer collections.prefix
  collections?: {
    prefix?: string
    adminGroup?: string | false
    slugs?: Partial<Record<AchievementCollectionKey, string>>
    overrides?: Partial<Record<AchievementCollectionKey, AchievementCollectionOverride>>
  }
  users?: { includeJoins?: boolean }
  endpoints?: { me?: string | false }
  extensions?: { ruleTypes?: AchievementRuleType[] }
})
```

### Core options

| Option | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` | Set `false` to leave the plugin installed but inactive (no collections / endpoints merged). |
| `usersCollectionSlug` | `'users'` | Users collection the plugin relates to (grants, requests, joins). |
| `canReview` | _(denied)_ | **Important.** Without this, users cannot manage catalogs or approve requests. Receives `(user, scopeId)` where `scopeId` may be `null`. |
| `scope` | _(none)_ | Multi-tenant hook-up. `collection` is the relation target (e.g. `'tenants'`). `relationField` defaults to `'scope'`. Adds an optional scope field across plugin collections. |
| `mediaCollection` | _(none)_ | When set (e.g. `'media'`), tiers get an optional upload field for ladder badge images. Icon string keys still work without this. |

### `collections`

| Option | Default | Notes |
| --- | --- | --- |
| `prefix` | `'achievement'` | Prefix for default slugs → REST paths and DB table names (`achievement-tiers`, …). |
| `adminGroup` | `'Achievements'` | Admin sidebar group. Pass `false` to leave collections ungrouped. |
| `slugs` | _(derived)_ | Absolute slug overrides per collection key (ignores `prefix` for that key). |
| `overrides` | _(none)_ | Per-collection patches: `access`, `admin`, `hooks`, `labels`. Access keys replace; hook arrays **append after** plugin hooks; `admin` / `labels` merge shallowly. |

Example override (notify after a grant is created via request approval):

```ts
achievementPlugin({
  canReview,
  collections: {
    overrides: {
      achievementRequests: {
        hooks: {
          afterChange: [
            async ({ doc, previousDoc }) => {
              if (doc.status === 'approved' && previousDoc?.status !== 'approved') {
                // notify, analytics, …
              }
            },
          ],
        },
      },
    },
  },
})
```

### `users`

| Option | Default | Notes |
| --- | --- | --- |
| `includeJoins` | `true` | Injects an `achievements` group on the users collection with joins to grants and requests. Set `false` if you own that UI yourself. |

### `endpoints`

| Option | Default | Notes |
| --- | --- | --- |
| `me` | `'/achievements/me'` | Registers `GET /api/achievements/me` for the signed-in user’s grants snapshot (+ derived tiers and lean requests). Pass `false` to skip. Having review access does **not** widen this endpoint to other users. |

Query params: `scope`, `limit`, `page`, `requestsLimit`.

### `extensions.ruleTypes`

Register custom rule evaluators merged with the built-ins:

```ts
achievementPlugin({
  canReview,
  extensions: {
    ruleTypes: [
      {
        type: 'host.custom-check',
        evaluate: async ({ rule, userId, payload, req }) => {
          // return true when the rule passes
          return true
        },
        // optional: progress: async () => 0.5,
        // optional: progressRole: 'requirement' | 'gate',
      },
    ],
  },
})
```

## Server helpers

Use these from hooks, jobs, and trusted endpoints — not from the public client:

```ts
import {
  recordLog,
  recordMetricChange,
  grantAchievement,
  reconcileProgression,
  reconcileUserProgression,
  resolveCurrentTier,
  resolveTierProgress,
  getUserProgress,
  submitAchievementRequest,
  reviewAchievementRequest,
} from '@dappermountain/payload-plugin-achievements'

await recordLog({ payload, userId, scopeId, type: 'host.custom-kind', actorId })
await recordMetricChange({ payload, userId, scopeId, metric: 'points', change: 10 })
const tier = await resolveCurrentTier({ payload, userId, scopeId })

// Repair users whose grants predate side-effect hooks (idempotent)
await reconcileProgression({ payload })

// Optional filters (ids or slugs)
await reconcileProgression({
  payload,
  userId: '…',
  scopeId: '…',
  achievementSlug: 'ring-grim',
  tierSlug: 'ring-solid',
})

// Host CLI (only boot config in the app — flags live in the plugin):
//   bun --env-file=.env ./scripts/reconcile-achievements.ts -- --user=<id> --achievement=ring-grim
import { runReconcileCli } from '@dappermountain/payload-plugin-achievements/cli'
await runReconcileCli({ config })
```

Pass catalog **slugs** (or ids) for `type` and `metric`. Metric totals are the sum of `change` on matching logs. Creating or deleting **grants** (Admin or API) writes `achievement.granted` / `achievement.revoked`, syncs composed achievements, and may open tier requests / write `tier.changed`.

Engine log `data` for those system events uses a shared transition envelope:

```ts
{ from: { id, slug? } | null, to: { id, slug? } | null }
```

| type | `from` | `to` |
| --- | --- | --- |
| `tier.changed` | previous tier (null on first climb) | current tier |
| `achievement.granted` | `null` | achievement |
| `achievement.revoked` | achievement | `null` |

Turning **Requires review** off on a definition or tier **approves pending requests** for that row only (each waiting user goes through the existing request hooks).

**Admin:** Grants list includes **Repair progression**, which `POST`s the reconcile endpoint (requires `canReview`).

## REST surface

| Goal | Request |
| --- | --- |
| Current user snapshot | `GET /api/achievements/me?scope=<scopeId>&limit=10&page=1` |
| Repair progression | `POST /api/achievements/reconcile` (reviewer; optional `{ userId, scopeId, achievementId\|achievementSlug, tierId\|tierSlug, limit }`) |
| List grants | `GET /api/achievement-grants?where[user][equals]=<userId>` |
| Log history | `GET /api/achievement-logs?where[user][equals]=<userId>` |
| Request an achievement | `POST /api/achievement-requests` with `{ achievement }` |
| Approve / reject achievement | `PATCH /api/achievement-requests/:id` with `{ status: "approved" \| "rejected" }` |
| Approve / reject tier | `PATCH /api/achievement-tier-requests/:id` with `{ status: "approved" \| "rejected" }` |
| Browse catalogs | `GET /api/achievement-event-types`, `GET /api/achievement-metrics`, … |

Exact collection paths follow your `collections.prefix` / `slugs` settings.

## Seeding

```ts
import {
  seedAchievementCatalog,
  seedAchievements,
} from '@dappermountain/payload-plugin-achievements'

await seedAchievementCatalog(payload) // system metrics + event types (English)

await seedAchievements(payload, {
  eventTypes: [{ name: 'Custom kind', slug: 'host.custom-kind', requiresActor: true }],
  metrics: [{ name: 'Streak days', slug: 'streak-days' }],
  tiers: [
    {
      name: 'Prospect',
      slug: 'prospect',
      rank: 0,
      unlockRules: [], // open
    },
  ],
  achievements: [
    {
      name: 'First steps',
      slug: 'first-steps',
      requiresReview: false,
      completionRules: [{ type: 'metric-minimum', metricSlug: 'points', minimum: 10 }],
    },
  ],
})
```

`name` / `description` accept a string (default locale) or a locale map (`{ en: '…', es: '…' }`) when Payload localization is enabled. Prefer seeding extra locales in the host after the English system catalog exists.

## License

MIT © Dapper Mountain

## Agent context (Cursor)

This repo vendors AI agent rules and skills under [`.agents/`](.agents/). See [`AGENTS.md`](AGENTS.md).

```bash
bun install
bun run agents:sync
bun run skills:install
```

Dev dependencies: [`@dappermountain/agent-practices`](https://www.npmjs.com/package/@dappermountain/agent-practices), [`@dappermountain/agent-payload`](https://www.npmjs.com/package/@dappermountain/agent-payload). Run `agents:sync` after install or upgrade so rules land under `.agents/`.

# `@dappermountain/payload-plugin-achievements`

Achievements, tiers, points, and an activity log for Payload CMS — all configured in Admin.

You describe what people can earn and what has to happen first. Your app records those happenings. The plugin derives the current tier and progress from that history, so the ladder stays in step with real activity.

## What you get

- **A catalog in Admin.** Achievements, tiers, metrics, event types, and reactions. Editors change rules there.
- **Composable rules.** Nested all-of / any-of trees, plus your own leaf types.
- **Derived tiers.** Current tier and next-tier fill come from the same unlock rules.
- **Request and review.** Members can ask for an achievement; reviewers approve or reject. Composed achievements can grant themselves when their completion rules pass.
- **An activity log.** Grants, score changes, tier moves, and your own event kinds.
- **Optional multi-tenant scope.** Point `scope` at your tenants / workspaces / orgs collection.
- **Host hooks.** Prefixable slugs, collection overrides, a review policy you inject, and server helpers for trusted code.

## Payload version support

| Plugin line | Payload | Notes |
| ----------- | ------- | ----- |
| **`1.x`** (this package — e.g. `1.0.0-beta.2`) | **4** (`^4.0.0-beta.1` / `^4.0.0`) | Current line. Opt out of P4 default versions/authorship on high-churn collections. |
| **`0.6.x`** | **3** (`^3.89`) | Last Payload 3 line. Same product features (reactions, composites, etc.). Stay on `0.6.x` until you upgrade the host to Payload 4. |

One published version cannot peer both Payload majors (Admin field types and collection defaults diverge). Pick the line that matches your host.

## Requirements (1.x)

- Payload `^4.0.0-beta.1` / `^4.0.0`
- `@payloadcms/ui` (same train as Payload)
- `@payloadcms/richtext-lexical` (same train as Payload)
- `lucide-react` `^0.543`
- React `^19`

Plugin collections opt out of Payload 4’s default versions and authorship (append-only logs and high-churn grants should not grow `_versions` tables).

## Install

```bash
# Payload 4 hosts
bun add @dappermountain/payload-plugin-achievements@^1.0.0-beta.2

# Payload 3 hosts (stay on the 0.6 line)
bun add @dappermountain/payload-plugin-achievements@0.6
```

`npm` and other clients work too. Next.js hosts should list the package in `transpilePackages` so the `'use client'` Admin fields compile.

## Wire it up

```ts
import { buildConfig } from 'payload'
import { achievementPlugin } from '@dappermountain/payload-plugin-achievements'

export default buildConfig({
  plugins: [
    achievementPlugin({
      usersCollectionSlug: 'users',
      canReview: (user, scopeId) => Boolean(user?.roles?.includes('admin')),
      // scope: { collection: 'tenants', relationField: 'scope' },
    }),
  ],
})
```

`canReview` is how staff get to edit catalogs and approve requests. It receives the user and a scope id (`null` when the row is global).

Then:

1. `payload generate:importmap` — Admin fields for logs, subjects, and Lucide icons.
2. Migrate (or push) schema. The plugin adds collections; your app still owns the migrate runner.
3. Restart so Payload can seed the system catalog on `onInit` (`points`, `metric.delta`, `achievement.granted`, `achievement.revoked`, `tier.changed`). Set `seedSystemCatalog: false` if you want to call `seedAchievementCatalog` yourself.

Your product catalog — extra event types, metrics, tiers, achievements — is `seedAchievements`.

## How the pieces fit

Think of four layers:

1. **Catalog** — named things in Admin (event types, metrics, tiers, achievements, reactions).
2. **Log** — what happened. Your hooks call `recordLog` / `recordMetricChange`. Grant and revoke write their own rows.
3. **Grants** — what someone has earned. One row per user (+ scope). Creating or deleting a grant updates the log and re-checks composed achievements and tiers.
4. **Reactions** — set-based side effects when a host event is logged or an achievement is granted/revoked.

Writing a host or metric log also re-checks composed achievements and derived tiers. Grant and revoke logs skip that path because the Grants hooks already ran it.

## Collections

Slugs use the prefix `achievement-` so they sit beside your own collections. Override with `collections.prefix` or per-key `collections.slugs`.

| Config key | Default slug | Purpose |
| --- | --- | --- |
| `metrics` | `achievement-metrics` | Named numbers: **stored** totals or **computed** values (elapsed time). |
| `metricBalances` | `achievement-metric-balances` | Running totals for stored metrics, per user (+ scope). Leaderboards read this. |
| `eventTypes` | `achievement-event-types` | Kinds of log entries you can count or require. |
| `tiers` | `achievement-tiers` | Ladder steps with unlock rules. |
| `achievements` | `achievement-definitions` | Earnable items with eligibility and completion rules. |
| `grants` | `achievement-grants` | One earned achievement per user (+ scope). |
| `achievementRequests` | `achievement-requests` | Request → pending / approved / rejected. |
| `tierRequests` | `achievement-tier-requests` | Tier unlock waiting on review (`requiresReview` on the tier). |
| `logs` | `achievement-logs` | Activity history. |
| `reactions` | `achievement-reactions` | Side effects when something is logged or granted. |

System rows (`points` and the four engine event types) are protected. The plugin locks their slugs and blocks deletes.

## Event types

Each log row points at an event type. Dotted slugs read well: `post.published`, `comment.created`, `course.completed`, `post.edited`.

Flags on the type decide which log fields Admin asks for:

| Flag | Log field |
| --- | --- |
| Requires an actor | `actor` — who caused it (a peer, an admin, …) |
| Adjusts a metric | `metric` + `change` |
| Requires a subject | `subject` — the host document (a post, a comment, a user, …) |
| Snapshot actor tiers | stamps the actor’s derived tier at write time |

**Actor tier** on an `event-count` rule then counts only logs whose snapshot already met that tier in this scope. Leave Actor tier blank to count every matching event. A filter only matches logs that were stamped.

Unscoped logs stamp every ladder. Scoped logs stamp that tenant plus any unscoped tiers.

## Subjects

Logs can link to a host document the same way they link to an actor.

```ts
achievementPlugin({
  canReview,
  subjects: {
    collections: ['posts', 'comments', 'users'],
  },
})
```

That turns on:

- **Requires a subject** and **Subject collections** on event types
- a polymorphic **Subject** field on logs
- `recordLog({ subject: logSubject('posts', postId) })`

`collections: 'all'` includes every collection on your Payload config except this plugin’s slugs and anything prefixed `payload-`. It is optional. The picker and generated types grow with your schema, and collections you add later show up after a restart.

Example — “this member enrolled”, scoped to a tenant, subject = the user:

```ts
await recordLog({
  payload,
  req,
  userId: memberId,
  scopeId: tenantId,
  type: 'user.enrolled',
  subject: logSubject('users', memberId),
})
```

Same shape as `post.published` with `subject: logSubject('posts', postId)`.

Put host document links on `subject`. Engine grant/revoke/tier rows use a small `{ from, to }` envelope in `data`:

| type | `from` | `to` |
| --- | --- | --- |
| `tier.changed` | previous tier (`null` on first climb) | current tier |
| `achievement.granted` | `null` | achievement |
| `achievement.revoked` | achievement | `null` |

## Rules

Unlock (tiers), eligibility, and completion (achievements) share one tree:

- Empty top-level list — everyone passes
- Groups — **All of these** (AND) or **Any of these** (OR)
- Built-in leaves — `tier-at-least`, `achievement-complete`, `metric-minimum`, `event-count`
- Your leaves — `extensions.ruleTypes` (`type`, `evaluate`, optional `progress`, `progressRole`, `label`, `fields`)

`label` and `fields` show up in the Admin rule editor. The plugin only displays those fields when that leaf type is selected.

**Eligibility** gates who may request an achievement. **Completion** describes what a composed achievement is made of. When `requiresReview` is off and completion passes, the parent grants itself. Nested achievement graphs skip cycles.

**Current tier** walks the ladder in `rank` order (`resolveCurrentTier`). A tier with `requiresReview` becomes current after an **approved** tier request. Turning `requiresReview` off approves pending requests for that row and writes missing `tier.changed` logs for people who already meet the unlock rules.

**Next-tier fill** (`resolveTierProgress` / `evaluateRuleProgress`):

| Combinator / leaf | Progress |
| --- | --- |
| AND | Equal average of *requirement* children |
| OR | Best child |
| `tier-at-least` | Gate — skipped in AND averages |
| `event-count` / `metric-minimum` | Fraction of the target |
| `achievement-complete` | `1` if granted; otherwise that achievement’s own completion (or eligibility) tree |

`buildUnlockRequirementLeaves` walks a tree and returns met/progress plus catalog subjects (`relations`, `target`, `unit`, `since`). Your UI supplies the copy. `achievement-complete` is omitted by default so those stay on catalog groups. `eachRuleLeaf` is the walker on its own.

## Metrics

**Stored** metrics (default `points`) are sums of `change` on `metric.delta` logs. `recordMetricChange` writes the log and updates `achievement-metric-balances` together. Reconcile rebuilds balances from the log if they drift.

**Computed** metrics (v1: elapsed time) are derived at evaluation:

- `kind: 'computed'`, `compute: 'elapsed'`
- `unit`: seconds, minutes, hours, days, years (365-day years)
- `since`: `user-created-at`, `first-event` (plus an event type), or a key from `extensions.metricAnchors`

System seed creates stored `points`. You seed computed metrics after your anchors are registered.

**Leaderboards** (`getMetricLeaderboard` / `GET /api/achievements/leaderboard?metric=points`) rank stored balances for authenticated users. Each row is `{ user, value, rank }`. Your UI adds names, current tier, and who may appear. For a single user’s computed value, call `resolveMetricValue`.

## Reactions

A reaction is: **when this happens, run this command**.

Triggers:

- **Event logged** — a host event type (for example `course.completed`)
- **Achievement granted** / **revoked** — a specific achievement

Built-in action: **Grant achievement** (no-op if they already have it).

Your actions go in `extensions.actions`. Each one needs a `type` (a command slug like `accessGroup.addMember`), optional `label` / `fields` for Admin, and a `run` function. `run` should be set-based: adding someone who is already a member is a no-op. Reactions run in the same request as the log or grant. Start a job from `run` if the work belongs on a queue.

Grant/revoke reactions fire from the grant row. Point event reactions at your host event types (`post.published`, `course.completed`, …).

## Custom rules, anchors, and actions

```ts
achievementPlugin({
  canReview,
  extensions: {
    metricAnchors: {
      'membership-started': {
        label: ({ t }) => t('custom:achievements:anchors:membershipStarted'),
        resolve: async ({ payload, userId, scopeId }) => {
          if (!scopeId) return null
          const found = await payload.find({
            collection: 'memberships',
            limit: 1,
            overrideAccess: true,
            where: {
              and: [
                { user: { equals: userId } },
                { workspace: { equals: scopeId } },
              ],
            },
          })
          const startedAt = (found.docs[0] as { startedAt?: string } | undefined)?.startedAt
          return startedAt ? new Date(startedAt) : null
        },
      },
    },
    ruleTypes: [
      {
        type: 'host.course-complete',
        label: 'Course complete',
        fields: [
          { name: 'course', type: 'relationship', relationTo: 'courses', required: true },
        ],
        evaluate: async ({ rule, userId, payload, req }) => {
          // return true when this user has completed rule.course
          return true
        },
      },
    ],
    actions: [
      {
        type: 'accessGroup.addMember',
        label: 'Add to access group',
        fields: [
          {
            name: 'accessGroup',
            type: 'relationship',
            relationTo: 'access-groups',
            required: true,
          },
        ],
        run: async ({ userId, reaction, req }) => {
          // merge the user into the group; already-a-member is a no-op
        },
      },
    ],
  },
})
```

Anchor `label` is a Payload Admin string (`OptionLabel`): plain text, `{ en, es }`, or `({ t }) => t('custom:…')`. Your app owns those `custom:` keys.

Then seed a computed metric (`since: 'membership-started'`) and use `metric-minimum` in rules.

## Access

- Catalog, grants, logs, reactions, and request approval use `canReview(user, scopeId)`.
- Metric balances: reviewers can read and delete; trusted helpers write them.
- Member-facing requests use normal collection access plus eligibility hooks.
- Server helpers (`recordLog`, `recordMetricChange`, `grantAchievement`, …) run with `overrideAccess: true`. Call them from hooks, jobs, and locked-down endpoints. Pass `req` so nested Local API stays in the same transaction.

## Localization

With Payload `localization` enabled, these catalog fields are already `localized: true`:

| Collection | Localized | Other |
| --- | --- | --- |
| Achievements / tiers | `name` (text), `description` (Lexical) | `slug`, rules, flags |
| Metrics / event types | `name` | `slug`, flags |

Tier `icon` is a Lucide picker (stores `sparkles`, `shield`, …). Peer-depend on `@payloadcms/richtext-lexical` and `lucide-react`. After upgrading, regenerate the import map and migrate so `description` columns accept JSON.

`GET /api/achievements/me` and progress helpers return Lexical `description` as stored. Convert in your UI (`convertLexicalToHTML`, `convertLexicalToPlaintext`, or the plugin’s `descriptionToPlaintext` / `plainTextToLexical`).

Admin chrome ships in English. Member-facing copy lives in your i18n bundle. Seed extra locales after the English system catalog exists.

## Configuration

```ts
achievementPlugin({
  enabled?: boolean
  seedSystemCatalog?: boolean
  usersCollectionSlug?: string
  canReview?: (user, scopeId) => boolean | Promise<boolean>
  scope?: { collection: string; relationField?: string }
  mediaCollection?: string
  slugPrefix?: string // deprecated; use collections.prefix
  collections?: {
    prefix?: string
    adminGroup?: string | false
    slugs?: Partial<Record<AchievementCollectionKey, string>>
    overrides?: Partial<Record<AchievementCollectionKey, AchievementCollectionOverride>>
  }
  users?: { includeJoins?: boolean }
  endpoints?: { me?: string | false; leaderboard?: string | false; reconcile?: string | false }
  subjects?: { collections?: 'all' | string[] }
  extensions?: {
    ruleTypes?: AchievementRuleType[]
    metricAnchors?: Record<string, AchievementMetricAnchorEntry>
    actions?: AchievementAction[]
  }
})
```

### Core

| Option | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` | `false` leaves the package installed with no collections or endpoints. |
| `seedSystemCatalog` | `true` | Upserts system metrics and event types on `onInit`. |
| `usersCollectionSlug` | `'users'` | Users collection for grants, requests, and joins. |
| `canReview` | denied | Staff catalog and approval access. `scopeId` may be `null`. |
| `scope` | unset | `collection` is the tenant target. `relationField` defaults to `'scope'`. |
| `mediaCollection` | unset | e.g. `'media'` — optional upload on tiers for badge images. Icon keys still work. |
| `extensions.metricAnchors` | unset | Named dates for elapsed metrics. |
| `extensions.ruleTypes` | unset | Custom rule leaves; `label` / `fields` appear in Admin. |
| `extensions.actions` | unset | Extra reaction commands. Built-in `achievement.grant` is always there. |

### `collections`

| Option | Default | Notes |
| --- | --- | --- |
| `prefix` | `'achievement'` | Default slugs, REST paths, and table names. |
| `adminGroup` | `'Achievements'` | Sidebar group. `false` leaves collections ungrouped. |
| `slugs` | derived | Absolute slug per key (ignores `prefix` for that key). |
| `overrides` | unset | `access`, `admin`, `hooks`, `labels`. Access keys replace; hook arrays append after plugin hooks; `admin` / `labels` merge shallowly. |

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
| `includeJoins` | `true` | Adds an `achievements` group on users (`grants` / `requests` joins). `false` if you already own that UI. |

### `subjects`

| Option | Default | Notes |
| --- | --- | --- |
| `collections` | `[]` | Host slugs for log `subject`, or `'all'`. Empty skips the feature. |

### `endpoints`

| Option | Default | Notes |
| --- | --- | --- |
| `me` | `'/achievements/me'` | Signed-in user’s grants, derived tiers, lean requests. `?reviews=1` adds a review snapshot. Always the caller’s own snapshot. `false` skips it. |
| `leaderboard` | `'/achievements/leaderboard'` | Stored-metric leaderboard. `false` skips it. |
| `reconcile` | `'/achievements/reconcile'` | Reviewer repair endpoint. `false` skips it. |

`me` query: `scope`, `limit`, `page`, `requestsLimit`, `reviews`. Leaderboard: `metric` (required), `scope`, `limit`, `page`.

## Server helpers

Call these from hooks, jobs, and trusted endpoints:

```ts
import {
  recordLog,
  recordMetricChange,
  getMetricLeaderboard,
  resolveMetricValue,
  grantAchievement,
  reconcileProgression,
  reconcileUserProgression,
  resolveCurrentTier,
  resolveTierProgress,
  getUserProgress,
  loadUserProgressReviews,
  buildUnlockRequirementLeaves,
  submitAchievementRequest,
  reviewAchievementRequest,
  logSubject,
} from '@dappermountain/payload-plugin-achievements'

await recordLog({ payload, req, userId, scopeId, type: 'post.published', subject: logSubject('posts', postId) })
await recordMetricChange({ payload, req, userId, scopeId, metric: 'points', change: 10 })
const points = await resolveMetricValue({ payload, req, userId, scopeId, metric: 'points' })
const board = await getMetricLeaderboard({ payload, req, metric: 'points', scopeId, limit: 20 })
const tier = await resolveCurrentTier({ payload, req, userId, scopeId })
const progress = await getUserProgress({ payload, req, userId, scopeId, include: { reviews: true } })
const unlockLeaves = await buildUnlockRequirementLeaves({
  payload,
  req,
  userId,
  scopeId,
  rules: nextTier.unlockRules,
  ladderRank: tier?.rank ?? null,
})

await reconcileProgression({ payload, req })
await reconcileProgression({
  payload,
  req,
  userId: '…',
  scopeId: '…',
  achievementSlug: 'first-steps',
  tierSlug: 'veteran',
})

import { runReconcileCli } from '@dappermountain/payload-plugin-achievements/cli'
await runReconcileCli({ config })
```

Pass catalog **slugs** or ids for `type` and `metric`. Creating or deleting a grant writes `achievement.granted` / `achievement.revoked`, syncs composed achievements, and may open tier requests or write `tier.changed`.

Turning **Requires review** off on a definition or tier approves that row’s pending requests (each waiting user goes through the existing request hooks).

The Grants list in Admin includes **Repair progression**, which `POST`s the reconcile endpoint (`canReview`).

Also exported: `collectionOf` / `slugOf` (resolved collection slugs), `syncProgressionFromLog`, `runReactions`.

## REST

Paths follow your `collections.prefix` / `slugs`.

| Goal | Request |
| --- | --- |
| Current user snapshot | `GET /api/achievements/me?scope=<scopeId>&limit=10&page=1` (`&reviews=1` for review keys) |
| Stored metric leaderboard | `GET /api/achievements/leaderboard?metric=points&scope=<scopeId>&limit=20&page=1` |
| Repair progression | `POST /api/achievements/reconcile` (reviewer; optional `{ userId, scopeId, achievementId\|achievementSlug, tierId\|tierSlug, limit }`) |
| List grants | `GET /api/achievement-grants?where[user][equals]=<userId>` |
| Log history | `GET /api/achievement-logs?where[user][equals]=<userId>` |
| Request an achievement | `POST /api/achievement-requests` with `{ achievement }` |
| Approve / reject achievement | `PATCH /api/achievement-requests/:id` with `{ status: "approved" \| "rejected" }` |
| Approve / reject tier | `PATCH /api/achievement-tier-requests/:id` with `{ status: "approved" \| "rejected" }` |
| Browse catalogs | `GET /api/achievement-event-types`, `GET /api/achievement-metrics`, `GET /api/achievement-reactions`, … |

## Seeding

```ts
import {
  seedAchievementCatalog,
  seedAchievements,
} from '@dappermountain/payload-plugin-achievements'

await seedAchievementCatalog(payload)

await seedAchievements(payload, {
  eventTypes: [
    { name: 'Post published', slug: 'post.published', requiresSubject: true, subjectRelationTo: ['posts'] },
    { name: 'Comment created', slug: 'comment.created', requiresActor: true, requiresSubject: true, subjectRelationTo: ['comments'] },
    { name: 'User enrolled', slug: 'user.enrolled', requiresSubject: true, subjectRelationTo: ['users'] },
  ],
  metrics: [
    { name: 'Streak days', slug: 'streak-days' },
    {
      name: 'Days as member',
      slug: 'days-as-member',
      kind: 'computed',
      compute: 'elapsed',
      unit: 'days',
      since: 'membership-started',
    },
  ],
  tiers: [
    { name: 'Novice', slug: 'novice', rank: 0, unlockRules: [] },
  ],
  achievements: [
    {
      name: 'First steps',
      slug: 'first-steps',
      requiresReview: false,
      completionRules: [{ type: 'metric-minimum', metricSlug: 'points', minimum: 10 }],
    },
  ],
  removeAchievementSlugs: ['old-slug'],
})
```

`name` / `description` accept a string (default locale) or `{ en: '…', es: '…' }` when localization is on. Seed extra locales after English system rows exist. Rule arrays in seed can use `metricSlug` / `eventTypeSlug` / `achievementSlug`; the seeder resolves them to relationships.

## License

MIT © Dapper Mountain

## Agent context (Cursor)

Rules and skills live under [`.agents/`](.agents/). See [`AGENTS.md`](AGENTS.md).

```bash
bun install
bun run agents:sync
bun run skills:install
```

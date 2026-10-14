---
name: payload-plugin-achievements
description: >-
  @dappermountain/payload-plugin-achievements — rule-based achievements,
  tiers, metrics, grants, requests, logs, and reactions for Payload CMS.
  Use when editing this plugin package or wiring it into a host config.
---

# Payload plugin: achievements

Read this skill **before** [`payload-overrides`](../payload-overrides/SKILL.md) and the vendored [`payload`](../payload/SKILL.md) skill when changing this package or integrating it.

The full implementer guide is the root [README.md](../../../README.md). This skill is the short map.

## Package

- npm / GitHub: `@dappermountain/payload-plugin-achievements`
- Entry: `achievementPlugin`; types from `./types`; Admin bits from `./client`; CLI from `./cli` (`runReconcileCli`)
- Peers (**1.x**): `payload` ^4 / ^4.0.0-beta.1, `@payloadcms/ui` + richtext same train, `lucide-react` ^0.543, `react` ^19. Payload 3 hosts stay on plugin **0.6.x**.
- Ships `dist/` for GitHub installs (Bun may skip `prepare`). Source uses `.js` specifiers (`NodeNext`).

## Host wiring

```ts
import { achievementPlugin } from '@dappermountain/payload-plugin-achievements'

plugins: [
  achievementPlugin({
    usersCollectionSlug: 'users',
    canReview: (user, scopeId) => Boolean(user?.roles?.includes('admin')),
    // scope?: { collection: 'tenants', relationField: 'scope' },
    // subjects?: { collections: ['posts', 'comments'] }, // or 'all'
    // extensions?: { ruleTypes, metricAnchors, actions },
  }),
]
```

Set **`canReview`** so staff can edit catalogs and approve requests.

**`subjects.collections`** turns on polymorphic log `subject` (slug list, or `'all'` minus plugin slugs and `payload-*`). Event types then get `requiresSubject` / `subjectRelationTo`. Write refs with `recordLog({ subject: logSubject('comments', id) })`.

System catalog (`points`, `metric.delta`, …) seeds on Payload **`onInit`** (`seedSystemCatalog`, default `true`). Product rows and extra locales go through `seedAchievements`.

After install: `payload generate:importmap`, host migrations, then product seed. Checklist: [reference/host-wiring.md](reference/host-wiring.md).

## Collections (prefix `achievement-`)

| Key | Default slug | Role |
| --- | --- | --- |
| metrics | `achievement-metrics` | Named scores; `kind: stored` \| `computed` |
| metricBalances | `achievement-metric-balances` | Stored totals per user (+ scope) |
| eventTypes | `achievement-event-types` | Log kinds |
| tiers | `achievement-tiers` | Ladder + unlock rules |
| achievements | `achievement-definitions` | Earnable items + rules |
| grants | `achievement-grants` | One grant per user (+ scope) |
| achievementRequests | `achievement-requests` | Request → review |
| tierRequests | `achievement-tier-requests` | Rank awaiting review |
| logs | `achievement-logs` | Activity history |
| reactions | `achievement-reactions` | Side effects on log / grant / revoke |

System rows (`points`, `metric.delta`, `achievement.granted`, `achievement.revoked`, `tier.changed`) are protected. System seed covers those stored/engine rows; you seed computed metrics after registering anchors.

## Rules and reactions

Shared tree for unlock / eligibility / completion via `buildRuleTreeFields({ dbName })`: **each embed site needs a unique short `dbName`** (nested group rules become `${dbName}_g`) so Postgres table/index names stay under 63 characters. Empty list passes; AND/OR groups; leaves `tier-at-least`, `achievement-complete`, `metric-minimum`, `event-count` (optional actor-tier snapshot); custom `extensions.ruleTypes` (`label` / `fields` in Admin). Elapsed metrics use `extensions.metricAnchors`. Reactions use built-in `achievement.grant` plus `extensions.actions`. Host logs re-check composed achievements; grant/revoke audit logs already did that in Grants hooks.

Current tier and next-tier fill are derived (`resolveCurrentTier`, `resolveTierProgress`).

## Server helpers (trusted)

`recordLog`, `recordMetricChange`, `getMetricLeaderboard`, `resolveMetricValue`, `rebuildMetricBalancesForUser`, `grantAchievement`, `reconcileProgression`, `reconcileUserProgression`, `resolveCurrentTier`, `resolveTierProgress`, `getUserProgress`, `loadUserProgressReviews`, `buildUnlockRequirementLeaves`, `eachRuleLeaf`, `submitAchievementRequest`, `reviewAchievementRequest`, `logSubject`, `readLogSubject`, `syncProgressionFromLog`, `runReactions` — Local API with `overrideAccess: true`. Pass `req` on nested ops (`security-critical.mdc`).

`recordLog({ subject })` needs `subjects.collections` and an event type with `requiresSubject`. Event types may **Snapshot actor tiers** so `event-count` can require a rank at write time.

`getMetricLeaderboard` ranks stored balances. Computed values use `resolveMetricValue` per user.

`buildUnlockRequirementLeaves` returns structured unlock leaves. Hosts format copy. `getUserProgress({ include: { reviews: true } })` adds pending achievement keys and open/rejected tier requests.

`recordMetricChange` writes `metric.delta` and the balance together. Reconcile rebuilds balances from logs.

Turning **Requires review** off approves that row’s pending requests. CLI: `runReconcileCli({ config })` from `@dappermountain/payload-plugin-achievements/cli`.

## Localization

Catalog `name` is localized text; achievement/tier `description` is Lexical (`localized: true` when the host enables localization). `/me` and progress helpers return Lexical as stored. Convert in the UI. Hosts supply `@payloadcms/richtext-lexical` + `lucide-react`; regenerate the import map after install.

## More detail

- [reference/collections.md](reference/collections.md)
- [reference/host-wiring.md](reference/host-wiring.md)
- Root [README.md](../../../README.md)

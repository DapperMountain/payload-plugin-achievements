# Host integration checklist

1. Add the plugin to `buildConfig({ plugins })` with `usersCollectionSlug` and `canReview`.
2. Optional: `scope` for multi-tenant, `mediaCollection` for tier badge uploads, `collections.overrides` for host hooks.
3. Optional: `subjects.collections` (host slugs, or `'all'`). Event types then expose `requiresSubject` / `subjectRelationTo`; write `recordLog({ subject: logSubject(...) })`.
4. Optional: `extensions.metricAnchors` for elapsed metrics. `label` is a Payload Admin `OptionLabel` (string, locale map, or `({ t }) => t('custom:…')`).
5. Optional: `extensions.ruleTypes` (`label` / `fields` for Admin) and `extensions.actions` (reaction commands). Actions are set-based and run in the same request.
6. `payload generate:importmap` after install / Admin component changes (Lexical description, Lucide icon, SubjectField).
7. Host migrations for new collections and field types — including `achievement-metric-balances`, `achievement-reactions`, metric `kind`, and log `subject` when subjects are on. The plugin leaves migrate to the host.
8. System catalog seeds on plugin `onInit` (`seedSystemCatalog: false` to opt out). Call `seedAchievements` for product rows, extra locales, and computed metrics after anchors are registered.
9. Record activity with `recordMetricChange` and `recordLog` from trusted code. Event types may **Snapshot actor tiers** at write; `event-count` can then require that rank in the rule’s scope (the stamp on the log). Host `recordLog` of your own types re-checks composed achievements.
10. REST: `GET /api/achievements/me` (`?reviews=1`), `GET /api/achievements/leaderboard?metric=points` (stored metrics; `endpoints.me` / `endpoints.leaderboard: false` to skip); repair with `POST /api/achievements/reconcile` or `runReconcileCli({ config })`.
11. Turning **Requires review** off auto-approves pending requests for that definition or tier.
12. Member UI: `resolveMetricValue` for points; `buildUnlockRequirementLeaves` then format copy in the host; `getUserProgress({ include: { reviews: true } })` or `loadUserProgressReviews` for review badges. Leaderboards return `{ user, value, rank }` for stored balances; you decide who appears and how rows look.

### Example: membership start date

```ts
achievementPlugin({
  usersCollectionSlug: 'users',
  scope: { collection: 'workspaces' },
  canReview: (user) => Boolean(user?.roles?.includes('admin')),
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
  },
})
```

Put `custom:achievements:anchors:membershipStarted` in the host i18n bundle. Seed a computed metric (`kind: 'computed'`, `compute: 'elapsed'`, `unit: 'days'`, `since: 'membership-started'`) and use `metric-minimum` in rules.

GitHub install: consume built `dist/` (Bun GitHub deps skip consumer `prepare`). The package is Node ESM; import the package name (`@dappermountain/payload-plugin-achievements`, `./cli`, `./client`, `./types`). Next hosts list it in `transpilePackages` so `'use client'` Admin components compile.

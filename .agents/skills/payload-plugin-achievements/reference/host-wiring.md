# Host integration checklist

1. Add plugin to `buildConfig({ plugins })` with `usersCollectionSlug` and `canReview`.
2. Optional: `scope` for multi-tenant, `mediaCollection` for tier badge uploads, `collections.overrides` for host hooks.
3. Optional: `extensions.metricAnchors` for host-specific dates used by computed elapsed metrics (e.g. product `grantedAt`). System seed does not depend on these keys. Prefer `{ label, resolve }` where `label` is a Payload Admin UI string (`OptionLabel`: locale map or `({ t }) => t('custom:…')`) — not CMS `localization`.
4. `payload generate:importmap` after install / Admin component changes (Lexical description + Lucide icon field).
5. Host migrations for new collections / field type changes (plugin does not own migrate runner) — includes `achievement-metric-balances` and metric `kind` fields.
6. System catalog: seeded automatically on plugin `onInit` (opt out with `seedSystemCatalog: false`). Hosts still call `seedAchievements` for product rows / extra locales (including computed metrics after anchors are registered).
7. Record gameplay via server helpers (`recordMetricChange`, `recordLog`, …) from trusted code only — do not create raw `metric.delta` logs if you need balances/leaderboards to stay correct (reconcile can rebuild).
8. Optional REST: `GET /api/achievements/me`, `GET /api/achievements/leaderboard?metric=points` (authenticated; disable with `endpoints.me` / `endpoints.leaderboard: false`); repair via `POST /api/achievements/reconcile` or `runReconcileCli({ config })` from `@dappermountain/payload-plugin-achievements/cli`.
9. Turning **Requires review** off auto-approves pending requests for that definition/tier (plugin hooks).

### Example: membership tenure anchor

```ts
achievementPlugin({
  usersCollectionSlug: 'users',
  scope: { collection: 'products' },
  canReview: (user) => Boolean(user?.roles?.includes('admin')),
  extensions: {
    metricAnchors: {
      'membership-granted': {
        label: ({ t }) => t('custom:achievements:anchors:membershipGranted'),
        resolve: async ({ payload, userId, scopeId }) => {
          if (!scopeId) return null
          const user = await payload.findByID({
            collection: 'users',
            id: userId,
            depth: 0,
            overrideAccess: true,
          })
          const row = (user as { products?: Array<{ product?: unknown; grantedAt?: string }> })
            .products?.find((p) => String(typeof p.product === 'object' && p.product && 'id' in p.product ? (p.product as { id: unknown }).id : p.product) === String(scopeId))
          return row?.grantedAt ? new Date(row.grantedAt) : null
        },
      },
    },
  },
})
```

Host `custom:achievements:anchors:membershipGranted` lives in the app i18n bundle (en + es). Then seed a computed metric (`kind: 'computed'`, `compute: 'elapsed'`, `unit: 'days'`, `since: 'membership-granted'`) and use `metric-minimum` in rules.

GitHub install note: consume built `dist/` — do not rely on consumer `prepare` for Bun GitHub deps. The package is Node ESM (`NodeNext`); host imports stay on the package name (`@dappermountain/payload-plugin-achievements`, `./cli`, `./client`, `./types`). Next hosts still list this package in `transpilePackages` so `'use client'` admin components compile.

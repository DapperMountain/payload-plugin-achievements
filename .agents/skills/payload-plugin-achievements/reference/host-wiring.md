# Host integration checklist

1. Add plugin to `buildConfig({ plugins })` with `usersCollectionSlug` and `canReview`.
2. Optional: `scope` for multi-tenant, `mediaCollection` for tier badge uploads, `collections.overrides` for host hooks.
3. `payload generate:importmap` after install / Admin component changes.
4. Host migrations for new collections (plugin does not own migrate runner).
5. `seedAchievementCatalog(payload)` once for system metric + event types.
6. Record gameplay via server helpers (`recordMetricChange`, `recordLog`, …) from trusted code only.
7. Optional REST: `GET /api/achievements/me` (disable with `endpoints.me: false`).

GitHub install note: consume built `dist/` — do not rely on consumer `prepare` for Bun GitHub deps.

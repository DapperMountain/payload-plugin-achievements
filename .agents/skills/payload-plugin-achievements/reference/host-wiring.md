# Host integration checklist

1. Add plugin to `buildConfig({ plugins })` with `usersCollectionSlug` and `canReview`.
2. Optional: `scope` for multi-tenant, `mediaCollection` for tier badge uploads, `collections.overrides` for host hooks.
3. `payload generate:importmap` after install / Admin component changes (Lexical description + Lucide icon field).
4. Host migrations for new collections / field type changes (plugin does not own migrate runner). Catalog `description` is Lexical JSON (was textarea) — push or migrate after upgrade.
5. Ensure peers: `@payloadcms/richtext-lexical`, `lucide-react` (plus `payload` / `@payloadcms/ui`).
6. `seedAchievementCatalog(payload)` once for system metric + event types.
7. Record gameplay via server helpers (`recordMetricChange`, `recordLog`, …) from trusted code only.
8. Optional REST: `GET /api/achievements/me` (disable with `endpoints.me: false`); repair via `POST /api/achievements/reconcile` or host one-liner `runReconcileCli({ config })` from `@dappermountain/payload-plugin-achievements/cli`.
9. Turning **Requires review** off auto-approves pending requests for that definition/tier (plugin hooks).

GitHub install note: consume built `dist/` — do not rely on consumer `prepare` for Bun GitHub deps. The package is Node ESM (`NodeNext`); host imports stay on the package name (`@dappermountain/payload-plugin-achievements`, `./cli`, `./client`, `./types`). Next hosts still list this package in `transpilePackages` so `'use client'` admin components compile.

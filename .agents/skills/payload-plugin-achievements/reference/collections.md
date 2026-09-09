# Collections and system catalog

Default slug prefix: `achievement-` (override via `collections.prefix` / `collections.slugs`).

## System rows (`seedAchievementCatalog`)

| Slug | Collection | Role |
| --- | --- | --- |
| `points` | metrics | Default **stored** metric |
| `metric.delta` | event-types | Metric change (needs metric + change) |
| `achievement.granted` | event-types | Written on grant |
| `achievement.revoked` | event-types | Written on revoke |
| `tier.changed` | event-types | Written when derived tier moves |

Do not delete or rename system slugs in seed/migrations casually — plugin protects them. System seed does **not** create computed metrics or reference host `metricAnchors`.

## Metrics

| Field | Notes |
| --- | --- |
| `kind` | `stored` (default) or `computed` |
| `compute` | When computed: `elapsed` (v1) |
| `unit` / `since` / `eventType` | Elapsed config; `since` options = built-ins + host anchor keys |

Stored totals: `achievement-metric-balances` (`user`, `scope`, `metric`, `value`, unique `key`). Updated by `recordMetricChange`; rebuilt by reconcile.

## Access

- Catalog / grants / logs / request approval: gated by host `canReview(user, scopeId)`.
- Metric balances: reviewers can read/delete; creates/updates only via trusted helpers.
- User-facing requests: normal collection access + eligibility hooks.
- Leaderboard endpoint: authenticated users; returns `user` id + `value` + `rank` only.

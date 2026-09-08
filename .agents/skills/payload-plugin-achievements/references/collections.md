# Collections and system catalog

Default slug prefix: `achievement-` (override via `collections.prefix` / `collections.slugs`).

## System rows (`seedAchievementCatalog`)

| Slug | Collection | Role |
| --- | --- | --- |
| `points` | metrics | Default metric |
| `metric.delta` | event-types | Metric change (needs metric + change) |
| `achievement.granted` | event-types | Written on grant |
| `tier.changed` | event-types | Written when derived tier moves |

Do not delete or rename system slugs in seed/migrations casually — plugin protects them.

## Access

- Catalog / grants / logs / request approval: gated by host `canReview(user, scopeId)`.
- User-facing requests: normal collection access + eligibility hooks.

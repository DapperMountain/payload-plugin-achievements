# Collections and system catalog

Default slug prefix: `achievement-` (`collections.prefix` / `collections.slugs`).

## System rows (`seedAchievementCatalog`)

| Slug | Collection | Role |
| --- | --- | --- |
| `points` | metrics | Default stored metric |
| `metric.delta` | event-types | Score change (needs metric + change) |
| `achievement.granted` | event-types | Written on grant |
| `achievement.revoked` | event-types | Written on revoke |
| `tier.changed` | event-types | Written when derived tier moves |

The plugin protects these slugs. System seed creates those rows; you seed computed metrics and host anchors yourself.

## Metrics

| Field | Notes |
| --- | --- |
| `kind` | `stored` (default) or `computed` |
| `compute` | When computed: `elapsed` (v1) |
| `unit` / `since` / `eventType` | Elapsed config. Units: seconds, minutes, hours, days, years (365-day years). `since` = built-ins + host anchor keys |

Event types: `requiresActor`, `requiresMetric`, `requiresSubject`, optional `snapshotActorTiers` (stamp derived actor ranks on the log). `event-count` may set `actorTier` against that snapshot, at-least, in the rule’s scope.

Stored totals: `achievement-metric-balances` (`user`, `scope`, `metric`, `value`, unique `key`). Updated by `recordMetricChange`; rebuilt by reconcile.

## Access

- Catalog / grants / logs / reactions / request approval: host `canReview(user, scopeId)`.
- Metric balances: reviewers can read/delete; trusted helpers write.
- Member requests: collection access + eligibility hooks.
- Leaderboard: authenticated users; `{ user, value, rank }` for stored metrics.

## Log subjects

`subjects.collections` (slug list or `'all'`) adds polymorphic `subject` on logs and `requiresSubject` / `subjectRelationTo` on event types. System types leave subject off. Host types such as `comment.created` typically set `requiresSubject: true` and `subjectRelationTo` to the matching collection. `'all'` drops plugin collections and `payload-*`.

## Reactions

`achievement-reactions`: `trigger` (`event` | `achievement.granted` | `achievement.revoked`) + `action`. Built-in `achievement.grant` takes `targetAchievement`. Host `extensions.actions` add commands; `run` is set-based and runs in-request. Point event triggers at host event types; grant/revoke triggers fire from the grant row.

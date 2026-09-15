import { describe, expect, test } from 'bun:test'

import {
  actorSnapshotMeetsTier,
  readActorTierSnapshotRows,
  scopeIdsForActorSnapshot,
} from './actorTierSnapshot.js'

describe('readActorTierSnapshotRows', () => {
  test('ignores non-arrays and incomplete rows', () => {
    expect(readActorTierSnapshotRows(null)).toEqual([])
    expect(readActorTierSnapshotRows([{ rank: 'x' }])).toEqual([])
  })

  test('reads populated scope relationships and unscoped rows', () => {
    expect(
      readActorTierSnapshotRows([
        { scope: 'scope-a', rank: 1 },
        { scope: { id: 'scope-b' }, rank: 0 },
        { rank: 2 },
      ]),
    ).toEqual([
      { scopeId: 'scope-a', rank: 1 },
      { scopeId: 'scope-b', rank: 0 },
      { scopeId: null, rank: 2 },
    ])
  })
})

describe('actorSnapshotMeetsTier', () => {
  const rows = [
    { scope: 'tenant-a', rank: 0 },
    { scope: 'tenant-b', rank: 4 },
  ]

  test('requires a snapshot row in the rule scope at or above the floor', () => {
    expect(actorSnapshotMeetsTier({ rows, scopeId: 'tenant-a', minimumRank: 1 })).toBe(false)
    expect(actorSnapshotMeetsTier({ rows, scopeId: 'tenant-a', minimumRank: 0 })).toBe(true)
    expect(actorSnapshotMeetsTier({ rows, scopeId: 'tenant-b', minimumRank: 1 })).toBe(true)
  })

  test('does not treat another scope or a missing stamp as a match', () => {
    expect(actorSnapshotMeetsTier({ rows, scopeId: 'tenant-c', minimumRank: 0 })).toBe(false)
    expect(actorSnapshotMeetsTier({ rows: [], scopeId: 'tenant-a', minimumRank: 0 })).toBe(false)
    expect(actorSnapshotMeetsTier({ rows: null, scopeId: 'tenant-a', minimumRank: 0 })).toBe(false)
  })
})

describe('scopeIdsForActorSnapshot', () => {
  const ladder = ['tenant-a', 'tenant-b', null]

  test('unscoped logs stamp every ladder scope', () => {
    expect(scopeIdsForActorSnapshot({ logScopeId: null, ladderScopeIds: ladder })).toEqual(ladder)
  })

  test('scoped logs stamp that tenant plus unscoped ranks', () => {
    expect(scopeIdsForActorSnapshot({ logScopeId: 'tenant-a', ladderScopeIds: ladder })).toEqual([
      'tenant-a',
      null,
    ])
  })
})

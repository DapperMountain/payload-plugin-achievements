import type { CollectionBeforeDeleteHook } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../helpers.js'
import { relationId } from '../../services/achievement/relationId.js'
import { eachRuleLeaf, type LeafVisitor } from './eachRuleLeaf.js'

async function countMatchingLeaves(args: {
  req: Parameters<CollectionBeforeDeleteHook>[0]['req']
  match: (rule: Record<string, unknown>) => boolean
}): Promise<number> {
  let count = 0
  const visit: LeafVisitor = (rule) => {
    if (args.match(rule)) count += 1
  }

  const [tiers, achievements] = await Promise.all([
    args.req.payload.find({
      collection: collectionOf('tiers'),
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      req: args.req,
    }),
    args.req.payload.find({
      collection: collectionOf('achievements'),
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      req: args.req,
    }),
  ])

  for (const doc of tiers.docs) {
    eachRuleLeaf((doc as { unlockRules?: unknown }).unlockRules, visit)
  }
  for (const doc of achievements.docs) {
    eachRuleLeaf((doc as { eligibilityRules?: unknown }).eligibilityRules, visit)
    eachRuleLeaf((doc as { completionRules?: unknown }).completionRules, visit)
  }
  return count
}

export function preventCatalogDelete(args: {
  kind: 'eventType' | 'metric'
}): CollectionBeforeDeleteHook {
  const { kind } = args

  return async ({ id, req }) => {
    const collectionKey = kind === 'eventType' ? 'eventTypes' : 'metrics'
    const doc = (await req.payload.findByID({
      collection: collectionOf(collectionKey),
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })) as { system?: boolean; name?: string } | null

    if (doc?.system) {
      throw new APIError('System catalog entries cannot be deleted.', 400)
    }

    const parts: string[] = []

    if (kind === 'eventType') {
      const logs = await req.payload.count({
        collection: collectionOf('logs'),
        overrideAccess: true,
        req,
        where: { type: { equals: id } },
      })
      if (logs.totalDocs > 0) parts.push(`${logs.totalDocs} log row(s)`)

      const rules = await countMatchingLeaves({
        req,
        match: (rule) =>
          (rule.type === 'event-count' || rule.type === 'elapsed-since') &&
          relationId(rule.eventType) === id,
      })
      if (rules > 0) parts.push(`${rules} rule(s)`)
    } else {
      const logs = await req.payload.count({
        collection: collectionOf('logs'),
        overrideAccess: true,
        req,
        where: { metric: { equals: id } },
      })
      if (logs.totalDocs > 0) parts.push(`${logs.totalDocs} log row(s)`)

      const balances = await req.payload.count({
        collection: collectionOf('metricBalances'),
        overrideAccess: true,
        req,
        where: { metric: { equals: id } },
      })
      if (balances.totalDocs > 0) parts.push(`${balances.totalDocs} balance row(s)`)

      const rules = await countMatchingLeaves({
        req,
        match: (rule) => rule.type === 'metric-minimum' && relationId(rule.metric) === id,
      })
      if (rules > 0) parts.push(`${rules} rule(s)`)
    }

    if (parts.length > 0) {
      throw new APIError(`Cannot delete "${doc?.name ?? id}": in use by ${parts.join(', ')}.`, 400)
    }
  }
}

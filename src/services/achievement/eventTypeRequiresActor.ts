import type { Payload, PayloadRequest } from 'payload'

import { getAchievementOptions } from '../../options-store.js'
import { collectionOf } from '../../collections/helpers.js'
import { relationId } from './relationId.js'

export type EventTypeFlags = {
  requiresActor: boolean
  requiresMetric: boolean
  requiresSubject: boolean
  /** Allowed host collections for `subject.relationTo` (empty = any plugin allowlist entry). */
  subjectRelationTo: string[]
}

const emptyFlags: EventTypeFlags = {
  requiresActor: false,
  requiresMetric: false,
  requiresSubject: false,
  subjectRelationTo: [],
}

function readSubjectRelationTo(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim()) out.push(entry.trim())
  }
  return out
}

/** Read flags from a loaded event-type document (or populated relationship). */
export function readEventTypeFlags(doc: unknown): EventTypeFlags | null {
  if (!doc || typeof doc !== 'object') return null
  const row = doc as {
    requiresActor?: boolean
    requiresMetric?: boolean
    requiresSubject?: boolean
    subjectRelationTo?: unknown
    slug?: string
  }
  const hasFlagKeys =
    'requiresActor' in row ||
    'requiresMetric' in row ||
    'requiresSubject' in row ||
    'subjectRelationTo' in row ||
    typeof row.slug === 'string'
  if (!hasFlagKeys) return null
  return {
    requiresActor: Boolean(row.requiresActor),
    requiresMetric: Boolean(row.requiresMetric) || row.slug === 'metric.delta',
    requiresSubject: Boolean(row.requiresSubject),
    subjectRelationTo: readSubjectRelationTo(row.subjectRelationTo),
  }
}

function flagsFromDoc(doc: unknown): EventTypeFlags | null {
  return readEventTypeFlags(doc)
}

/** Flags from an event-type catalog row (or its id). */
export async function getEventTypeFlags(args: {
  payload: Payload
  req?: PayloadRequest
  typeIdOrDoc: unknown
}): Promise<EventTypeFlags> {
  const embedded = flagsFromDoc(args.typeIdOrDoc)
  if (embedded && args.typeIdOrDoc && typeof args.typeIdOrDoc === 'object') {
    const row = args.typeIdOrDoc as Record<string, unknown>
    if (
      'requiresActor' in row ||
      'requiresMetric' in row ||
      'requiresSubject' in row ||
      'subjectRelationTo' in row ||
      'slug' in row
    ) {
      return embedded
    }
  }

  const typeId = relationId(args.typeIdOrDoc)
  if (!typeId) return { ...emptyFlags }

  const found = (await args.payload.findByID({
    collection: collectionOf('eventTypes'),
    id: typeId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
    select: {
      requiresActor: true,
      requiresMetric: true,
      requiresSubject: true,
      subjectRelationTo: true,
      slug: true,
    },
  })) as {
    requiresActor?: boolean
    requiresMetric?: boolean
    requiresSubject?: boolean
    subjectRelationTo?: unknown
    slug?: string
  } | null

  return flagsFromDoc(found) ?? { ...emptyFlags }
}

export async function eventTypeRequiresActor(args: {
  payload: Payload
  req?: PayloadRequest
  typeIdOrDoc: unknown
}): Promise<boolean> {
  return (await getEventTypeFlags(args)).requiresActor
}

export async function eventTypeRequiresMetric(args: {
  payload: Payload
  req?: PayloadRequest
  typeIdOrDoc: unknown
}): Promise<boolean> {
  return (await getEventTypeFlags(args)).requiresMetric
}

export async function eventTypeRequiresSubject(args: {
  payload: Payload
  req?: PayloadRequest
  typeIdOrDoc: unknown
}): Promise<boolean> {
  return (await getEventTypeFlags(args)).requiresSubject
}

/**
 * Allowed `subject.relationTo` values for this event type.
 * Empty event-type list → full plugin allowlist. Feature off → [].
 */
export async function eventTypeSubjectRelationTo(args: {
  payload: Payload
  req?: PayloadRequest
  typeIdOrDoc: unknown
}): Promise<string[]> {
  const allowlist = getAchievementOptions().subjectCollections
  if (allowlist.length === 0) return []
  const flags = await getEventTypeFlags(args)
  if (!flags.requiresSubject) return []
  if (flags.subjectRelationTo.length === 0) return [...allowlist]
  return flags.subjectRelationTo.filter((slug) => allowlist.includes(slug))
}

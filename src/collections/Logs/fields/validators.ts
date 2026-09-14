import type { Validate } from 'payload'

import { getAchievementOptions } from '../../../options-store.js'
import { collectionOf } from '../../../collections/helpers.js'
import {
  eventTypeRequiresActor,
  eventTypeRequiresMetric,
  eventTypeSubjectRelationTo,
  getEventTypeFlags,
} from '../../../services/achievement/eventTypeRequiresActor.js'
import { readLogSubject } from '../../../services/achievement/logSubject.js'
import { relationId } from '../../../services/achievement/relationId.js'

export const validateActor: Validate = async (value, { data, req }) => {
  if (!req?.payload) return true
  const typeId = relationId((data as { type?: unknown } | undefined)?.type)
  if (!typeId) return true
  if (!(await eventTypeRequiresActor({ payload: req.payload, req, typeIdOrDoc: typeId }))) {
    return true
  }
  if (!relationId(value)) {
    return 'This log type needs an actor (who caused it).'
  }
  return true
}

export const validateMetric: Validate = async (value, { data, req }) => {
  if (!req?.payload) return true
  const typeId = relationId((data as { type?: unknown } | undefined)?.type)
  if (!typeId) return true
  if (!(await eventTypeRequiresMetric({ payload: req.payload, req, typeIdOrDoc: typeId }))) {
    return true
  }
  const metricId = relationId(value)
  if (!metricId) {
    return 'This log type needs a metric.'
  }

  const metric = (await req.payload.findByID({
    collection: collectionOf('metrics'),
    id: metricId,
    depth: 0,
    overrideAccess: true,
    req,
    select: { kind: true, name: true, slug: true },
  })) as { kind?: string | null; name?: string; slug?: string } | null

  if (metric && (metric.kind ?? 'stored') === 'computed') {
    return 'Computed metrics (for example Days) cannot be changed with a metric delta. Use a stored metric such as Points.'
  }

  return true
}

export const validateChange: Validate = async (value, { data, req }) => {
  if (!req?.payload) return true
  const typeId = relationId((data as { type?: unknown } | undefined)?.type)
  if (!typeId) return true
  if (!(await eventTypeRequiresMetric({ payload: req.payload, req, typeIdOrDoc: typeId }))) {
    return true
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'This log type needs a change amount.'
  }
  return true
}

export const validateSubject: Validate = async (value, { data, req }) => {
  if (!req?.payload) return true
  const allowlist = getAchievementOptions().subjectCollections
  if (allowlist.length === 0) return true

  const typeId = relationId((data as { type?: unknown } | undefined)?.type)
  if (!typeId) return true

  const flags = await getEventTypeFlags({
    payload: req.payload,
    req,
    typeIdOrDoc: typeId,
  })
  const subject = readLogSubject(value)

  if (!flags.requiresSubject) {
    return true
  }

  if (!subject) {
    return 'This log type needs a subject (the host document it is about).'
  }

  if (!allowlist.includes(subject.relationTo)) {
    return `Subject collection "${subject.relationTo}" is not in the plugin subjects allowlist.`
  }

  const allowed = await eventTypeSubjectRelationTo({
    payload: req.payload,
    req,
    typeIdOrDoc: typeId,
  })
  if (allowed.length > 0 && !allowed.includes(subject.relationTo)) {
    return `This log type only allows subjects from: ${allowed.join(', ')}.`
  }

  return true
}

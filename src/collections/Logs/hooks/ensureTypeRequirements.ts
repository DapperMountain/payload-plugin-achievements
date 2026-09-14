import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

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

export const ensureTypeRequirements: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data

  const typeId = relationId((data as { type?: unknown }).type)
  if (!typeId) return data

  const flags = await getEventTypeFlags({
    payload: req.payload,
    req,
    typeIdOrDoc: typeId,
  })

  if (flags.requiresActor && !relationId((data as { actor?: unknown }).actor)) {
    throw new APIError('This log type needs an actor (who caused it).', 400)
  }

  if (flags.requiresMetric) {
    const metricId = relationId((data as { metric?: unknown }).metric)
    if (!metricId) {
      throw new APIError('This log type needs a metric.', 400)
    }
    const change = (data as { change?: unknown }).change
    if (typeof change !== 'number' || Number.isNaN(change)) {
      throw new APIError('This log type needs a change amount.', 400)
    }

    const metric = (await req.payload.findByID({
      collection: collectionOf('metrics'),
      id: metricId,
      depth: 0,
      overrideAccess: true,
      req,
      select: { kind: true },
    })) as { kind?: string | null } | null

    if (metric && (metric.kind ?? 'stored') === 'computed') {
      throw new APIError(
        'Computed metrics cannot be changed with a metric delta. Use a stored metric such as Points.',
        400,
      )
    }
  }

  if (flags.requiresSubject && getAchievementOptions().subjectCollections.length > 0) {
    const subject = readLogSubject((data as { subject?: unknown }).subject)
    if (!subject) {
      throw new APIError('This log type needs a subject (the host document it is about).', 400)
    }

    const allowed = await eventTypeSubjectRelationTo({
      payload: req.payload,
      req,
      typeIdOrDoc: typeId,
    })
    if (allowed.length > 0 && !allowed.includes(subject.relationTo)) {
      throw new APIError(
        `This log type only allows subjects from: ${allowed.join(', ')}.`,
        400,
      )
    }
  }

  return data
}

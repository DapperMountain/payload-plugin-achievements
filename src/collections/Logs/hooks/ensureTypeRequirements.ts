import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import {
  eventTypeRequiresActor,
  eventTypeRequiresMetric,
} from '../../../services/achievement/eventTypeRequiresActor.js'
import { relationId } from '../../../services/achievement/relationId.js'

export const ensureTypeRequirements: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data

  const typeId = relationId((data as { type?: unknown }).type)
  if (!typeId) return data

  const flags = {
    requiresActor: await eventTypeRequiresActor({
      payload: req.payload,
      req,
      typeIdOrDoc: typeId,
    }),
    requiresMetric: await eventTypeRequiresMetric({
      payload: req.payload,
      req,
      typeIdOrDoc: typeId,
    }),
  }

  if (flags.requiresActor && !relationId((data as { actor?: unknown }).actor)) {
    throw new APIError('This log type needs an actor (who caused it).', 400)
  }

  if (flags.requiresMetric) {
    if (!relationId((data as { metric?: unknown }).metric)) {
      throw new APIError('This log type needs a metric.', 400)
    }
    const change = (data as { change?: unknown }).change
    if (typeof change !== 'number' || Number.isNaN(change)) {
      throw new APIError('This log type needs a change amount.', 400)
    }
  }

  return data
}

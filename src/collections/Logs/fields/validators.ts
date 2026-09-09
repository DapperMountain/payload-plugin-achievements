import type { Validate } from 'payload'

import {
  eventTypeRequiresActor,
  eventTypeRequiresMetric,
} from '../../../services/achievement/eventTypeRequiresActor.js'
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
  if (!relationId(value)) {
    return 'This log type needs a metric.'
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

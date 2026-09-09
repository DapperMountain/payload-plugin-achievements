import type { Endpoint } from 'payload'

import type { ResolvedAchievementOptions } from '../defaults.js'
import { buildMeEndpoint } from './me.js'
import { buildReconcileEndpoint } from './reconcile.js'

export function buildAchievementEndpoints(options: ResolvedAchievementOptions): Endpoint[] {
  const endpoints: Endpoint[] = []
  if (options.endpoints.me !== false) {
    endpoints.push(buildMeEndpoint(options.endpoints.me))
  }
  if (options.endpoints.reconcile !== false) {
    endpoints.push(buildReconcileEndpoint(options.endpoints.reconcile))
  }
  return endpoints
}

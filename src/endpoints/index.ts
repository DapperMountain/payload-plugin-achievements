import type { Endpoint } from 'payload'

import type { ResolvedAchievementOptions } from '../defaults'
import { buildMeEndpoint } from './me'

export function buildAchievementEndpoints(options: ResolvedAchievementOptions): Endpoint[] {
  if (options.endpoints.me === false) return []
  return [buildMeEndpoint(options.endpoints.me)]
}

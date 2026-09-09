import type { Option } from 'payload'

import { getMetricAnchorEntries } from './metricAnchors.js'

const BUILTIN_ELAPSED_SINCE_OPTIONS: Option[] = [
  { label: 'User created at', value: 'user-created-at' },
  { label: 'First matching event log', value: 'first-event' },
]

/**
 * Admin select options for elapsed `since`.
 * Built-in labels are English (same as other plugin Admin chrome).
 * Host anchors pass through Payload {@link OptionLabel} (string, locale map, or `({ t }) => t(…)`).
 */
export function elapsedSinceSelectOptions(): Option[] {
  return [
    ...BUILTIN_ELAPSED_SINCE_OPTIONS,
    ...getMetricAnchorEntries().map(({ key, label }) => ({ label, value: key })),
  ]
}

export function isBuiltinElapsedSince(since: string): boolean {
  return since === 'user-created-at' || since === 'first-event'
}

'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

export type EventTypeFlags = {
  requiresActor: boolean
  requiresMetric: boolean
}

function relationId(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' && id) return id
    if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  }
  return null
}

function flagsFromValue(typeValue: unknown): EventTypeFlags | null {
  if (!typeValue || typeof typeValue !== 'object') return null
  if (!('requiresActor' in typeValue || 'requiresMetric' in typeValue || 'slug' in typeValue)) {
    return null
  }
  const row = typeValue as { requiresActor?: boolean; requiresMetric?: boolean; slug?: string }
  return {
    requiresActor: Boolean(row.requiresActor),
    requiresMetric: Boolean(row.requiresMetric) || row.slug === 'metric.delta',
  }
}

const empty: EventTypeFlags = { requiresActor: false, requiresMetric: false }

/** Resolve event-type flags for the selected `type` field (fetch when only an id is present). */
export function useEventTypeFlags(eventTypesSlug: string): EventTypeFlags {
  const { config } = useConfig()
  const typeValue = useFormFields(([fields]) => fields.type?.value)
  const typeId = useMemo(() => relationId(typeValue), [typeValue])
  const known = flagsFromValue(typeValue)
  const [flags, setFlags] = useState<EventTypeFlags>(known ?? empty)

  useEffect(() => {
    if (known) {
      setFlags(known)
      return
    }

    if (!typeId || !eventTypesSlug) {
      setFlags(empty)
      return
    }

    const controller = new AbortController()
    const api = config.routes?.api ?? '/api'
    const serverURL = config.serverURL ?? ''
    const url = `${serverURL}${api}/${eventTypesSlug}/${typeId}?depth=0&select[requiresActor]=true&select[requiresMetric]=true&select[slug]=true`

    void fetch(url, { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          setFlags(empty)
          return
        }
        const doc = await res.json()
        setFlags(flagsFromValue(doc) ?? empty)
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
        setFlags(empty)
      })

    return () => controller.abort()
  }, [known, typeId, eventTypesSlug, config.routes?.api, config.serverURL])

  return flags
}

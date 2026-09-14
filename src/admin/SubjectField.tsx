'use client'

import type { RelationshipFieldClientProps } from 'payload'
import { RelationshipField, useField } from '@payloadcms/ui'
import React, { useEffect, useMemo } from 'react'

import { useEventTypeFlags } from './useEventTypeFlags.js'

type SubjectFieldProps = RelationshipFieldClientProps & {
  eventTypesSlug: string
  /** Plugin allowlist — used when the event type leaves `subjectRelationTo` empty. */
  subjectCollections: string[]
}

/**
 * Polymorphic subject — only when the selected event type requires a host document.
 * Clears the value when the type does not require a subject.
 */
export function SubjectField(props: SubjectFieldProps) {
  const { eventTypesSlug, subjectCollections, ...fieldArgs } = props
  const { requiresSubject, subjectRelationTo } = useEventTypeFlags(eventTypesSlug)
  const { setValue, value } = useField({ path: fieldArgs.path })

  const allowedCollections = useMemo(() => {
    if (subjectRelationTo.length > 0) {
      return subjectRelationTo.filter((slug) => subjectCollections.includes(slug))
    }
    return subjectCollections
  }, [subjectCollections, subjectRelationTo])

  useEffect(() => {
    if (!requiresSubject && value != null && value !== '') {
      setValue(null)
      return
    }

    if (!requiresSubject || !value || typeof value !== 'object') return
    const relationTo = (value as { relationTo?: unknown }).relationTo
    if (typeof relationTo === 'string' && allowedCollections.length > 0 && !allowedCollections.includes(relationTo)) {
      setValue(null)
    }
  }, [requiresSubject, setValue, value, allowedCollections])

  if (!requiresSubject || allowedCollections.length === 0) return null

  return (
    <RelationshipField
      {...fieldArgs}
      field={{
        ...fieldArgs.field,
        relationTo: allowedCollections,
      }}
    />
  )
}

'use client'

import type { RelationshipFieldClientProps } from 'payload'
import { RelationshipField, useField } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useEventTypeFlags } from './useEventTypeFlags'

type ActorFieldProps = RelationshipFieldClientProps & {
  eventTypesSlug: string
}

/** Relationship field that only renders when the selected event type requires an actor. */
export function ActorField(props: ActorFieldProps) {
  const { eventTypesSlug, ...fieldArgs } = props
  const { requiresActor } = useEventTypeFlags(eventTypesSlug)
  const { setValue, value } = useField({ path: fieldArgs.path })

  useEffect(() => {
    if (!requiresActor && value != null && value !== '') {
      setValue(null)
    }
  }, [requiresActor, setValue, value])

  if (!requiresActor) return null

  return <RelationshipField {...fieldArgs} />
}

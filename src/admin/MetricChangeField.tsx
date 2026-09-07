'use client'

import type { NumberFieldClientProps } from 'payload'
import { NumberField, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useEventTypeFlags } from './useEventTypeFlags'

type MetricChangeFieldProps = NumberFieldClientProps & {
  eventTypesSlug: string
}

/** Signed change amount — only when the type adjusts a metric and a metric is selected. */
export function MetricChangeField(props: MetricChangeFieldProps) {
  const { eventTypesSlug, ...fieldArgs } = props
  const { requiresMetric } = useEventTypeFlags(eventTypesSlug)
  const metricValue = useFormFields(([fields]) => fields.metric?.value)
  const { setValue, value } = useField({ path: fieldArgs.path })
  const show = requiresMetric && Boolean(metricValue)

  useEffect(() => {
    if (!show && value != null && value !== '') {
      setValue(null)
    }
  }, [show, setValue, value])

  if (!show) return null

  return <NumberField {...fieldArgs} />
}

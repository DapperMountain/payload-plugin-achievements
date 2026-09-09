'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { NumberField, useField, useFormFields } from '@payloadcms/ui';
import { useEffect } from 'react';
import { useEventTypeFlags } from './useEventTypeFlags.js';
/** Signed change amount — only when the type adjusts a metric and a metric is selected. */
export function MetricChangeField(props) {
    const { eventTypesSlug, ...fieldArgs } = props;
    const { requiresMetric } = useEventTypeFlags(eventTypesSlug);
    const metricValue = useFormFields(([fields]) => fields.metric?.value);
    const { setValue, value } = useField({ path: fieldArgs.path });
    const show = requiresMetric && Boolean(metricValue);
    useEffect(() => {
        if (!show && value != null && value !== '') {
            setValue(null);
        }
    }, [show, setValue, value]);
    if (!show)
        return null;
    return _jsx(NumberField, { ...fieldArgs });
}

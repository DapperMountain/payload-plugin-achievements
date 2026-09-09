'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { RelationshipField, useField } from '@payloadcms/ui';
import { useEffect } from 'react';
import { useEventTypeFlags } from './useEventTypeFlags.js';
/** Metric relationship — only for event types that adjust a score. */
export function MetricField(props) {
    const { eventTypesSlug, ...fieldArgs } = props;
    const { requiresMetric } = useEventTypeFlags(eventTypesSlug);
    const metric = useField({ path: fieldArgs.path });
    const change = useField({ path: 'change' });
    useEffect(() => {
        if (requiresMetric)
            return;
        if (metric.value != null && metric.value !== '')
            metric.setValue(null);
        if (change.value != null && change.value !== '')
            change.setValue(null);
    }, [requiresMetric, metric.value, metric.setValue, change.value, change.setValue]);
    if (!requiresMetric)
        return null;
    return _jsx(RelationshipField, { ...fieldArgs });
}

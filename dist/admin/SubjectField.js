'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { RelationshipField, useField } from '@payloadcms/ui';
import { useEffect, useMemo } from 'react';
import { useEventTypeFlags } from './useEventTypeFlags.js';
/**
 * Polymorphic subject — only when the selected event type requires a host document.
 * Clears the value when the type does not require a subject.
 */
export function SubjectField(props) {
    const { eventTypesSlug, subjectCollections, ...fieldArgs } = props;
    const { requiresSubject, subjectRelationTo } = useEventTypeFlags(eventTypesSlug);
    const { setValue, value } = useField({ path: fieldArgs.path });
    const allowedCollections = useMemo(() => {
        if (subjectRelationTo.length > 0) {
            return subjectRelationTo.filter((slug) => subjectCollections.includes(slug));
        }
        return subjectCollections;
    }, [subjectCollections, subjectRelationTo]);
    useEffect(() => {
        if (!requiresSubject && value != null && value !== '') {
            setValue(null);
            return;
        }
        if (!requiresSubject || !value || typeof value !== 'object')
            return;
        const relationTo = value.relationTo;
        if (typeof relationTo === 'string' && allowedCollections.length > 0 && !allowedCollections.includes(relationTo)) {
            setValue(null);
        }
    }, [requiresSubject, setValue, value, allowedCollections]);
    if (!requiresSubject || allowedCollections.length === 0)
        return null;
    return (_jsx(RelationshipField, { ...fieldArgs, field: {
            ...fieldArgs.field,
            relationTo: allowedCollections,
        } }));
}

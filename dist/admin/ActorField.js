'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { RelationshipField, useField } from '@payloadcms/ui';
import { useEffect } from 'react';
import { useEventTypeFlags } from './useEventTypeFlags.js';
/** Relationship field that only renders when the selected event type requires an actor. */
export function ActorField(props) {
    const { eventTypesSlug, ...fieldArgs } = props;
    const { requiresActor } = useEventTypeFlags(eventTypesSlug);
    const { setValue, value } = useField({ path: fieldArgs.path });
    useEffect(() => {
        if (!requiresActor && value != null && value !== '') {
            setValue(null);
        }
    }, [requiresActor, setValue, value]);
    if (!requiresActor)
        return null;
    return _jsx(RelationshipField, { ...fieldArgs });
}

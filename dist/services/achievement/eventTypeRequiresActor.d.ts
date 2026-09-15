import type { Payload, PayloadRequest } from 'payload';
export type EventTypeFlags = {
    requiresActor: boolean;
    requiresMetric: boolean;
    requiresSubject: boolean;
    /** Stamp the actor's derived ladder ranks on the log at write time. */
    snapshotActorTiers: boolean;
    /** Allowed host collections for `subject.relationTo` (empty = any plugin allowlist entry). */
    subjectRelationTo: string[];
};
/** Read flags from a loaded event-type document (or populated relationship). */
export declare function readEventTypeFlags(doc: unknown): EventTypeFlags | null;
/** Flags from an event-type catalog row (or its id). */
export declare function getEventTypeFlags(args: {
    payload: Payload;
    req?: PayloadRequest;
    typeIdOrDoc: unknown;
}): Promise<EventTypeFlags>;
export declare function eventTypeRequiresActor(args: {
    payload: Payload;
    req?: PayloadRequest;
    typeIdOrDoc: unknown;
}): Promise<boolean>;
export declare function eventTypeRequiresMetric(args: {
    payload: Payload;
    req?: PayloadRequest;
    typeIdOrDoc: unknown;
}): Promise<boolean>;
export declare function eventTypeRequiresSubject(args: {
    payload: Payload;
    req?: PayloadRequest;
    typeIdOrDoc: unknown;
}): Promise<boolean>;
/**
 * Allowed `subject.relationTo` values for this event type.
 * Empty event-type list → full plugin allowlist. Feature off → [].
 */
export declare function eventTypeSubjectRelationTo(args: {
    payload: Payload;
    req?: PayloadRequest;
    typeIdOrDoc: unknown;
}): Promise<string[]>;
//# sourceMappingURL=eventTypeRequiresActor.d.ts.map
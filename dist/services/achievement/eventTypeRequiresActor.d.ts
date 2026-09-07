import type { Payload, PayloadRequest } from 'payload';
export type EventTypeFlags = {
    requiresActor: boolean;
    requiresMetric: boolean;
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
//# sourceMappingURL=eventTypeRequiresActor.d.ts.map
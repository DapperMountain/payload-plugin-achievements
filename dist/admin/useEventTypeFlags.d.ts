export type EventTypeFlags = {
    requiresActor: boolean;
    requiresMetric: boolean;
};
/** Resolve event-type flags for the selected `type` field (fetch when only an id is present). */
export declare function useEventTypeFlags(eventTypesSlug: string): EventTypeFlags;
//# sourceMappingURL=useEventTypeFlags.d.ts.map
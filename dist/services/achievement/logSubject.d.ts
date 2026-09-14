/** Polymorphic relationship value (Payload `relationTo` + `value`). */
export type LogSubjectRef = {
    relationTo: string;
    value: string;
};
/** Build a log subject ref for `recordLog({ subject })`. */
export declare function logSubject(relationTo: string, value: string): LogSubjectRef;
/**
 * Normalize a polymorphic relationship (Admin / Local API shape) to `{ relationTo, value }`.
 * Accepts nested docs (`value: { id }`) and plain ids under `value`.
 */
export declare function readLogSubject(value: unknown): LogSubjectRef | null;
//# sourceMappingURL=logSubject.d.ts.map
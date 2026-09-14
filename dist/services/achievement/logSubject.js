import { relationId } from './relationId.js';
/** Build a log subject ref for `recordLog({ subject })`. */
export function logSubject(relationTo, value) {
    return { relationTo, value };
}
/**
 * Normalize a polymorphic relationship (Admin / Local API shape) to `{ relationTo, value }`.
 * Accepts nested docs (`value: { id }`) and plain ids under `value`.
 */
export function readLogSubject(value) {
    if (!value || typeof value !== 'object')
        return null;
    const row = value;
    if (typeof row.relationTo !== 'string' || !row.relationTo.trim())
        return null;
    const id = relationId(row.value);
    if (!id)
        return null;
    return { relationTo: row.relationTo.trim(), value: id };
}

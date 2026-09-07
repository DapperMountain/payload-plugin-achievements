/** Normalize a Payload relationship value to a string id. */
export function relationId(value) {
    if (typeof value === 'string' && value)
        return value;
    if (typeof value === 'number' && Number.isFinite(value))
        return String(value);
    if (value && typeof value === 'object' && 'id' in value) {
        const id = value.id;
        if (typeof id === 'string' && id)
            return id;
        if (typeof id === 'number' && Number.isFinite(id))
            return String(id);
    }
    return null;
}

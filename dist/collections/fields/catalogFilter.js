import { relationId } from '../../services/achievement/relationId';
/** Relationship picker: same scope as the parent doc, or unscoped (global) catalog rows. */
export function catalogFilterOptions({ data }) {
    const scopeId = relationId(data?.scope);
    if (!scopeId)
        return true;
    return {
        or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }, { scope: { equals: null } }],
    };
}

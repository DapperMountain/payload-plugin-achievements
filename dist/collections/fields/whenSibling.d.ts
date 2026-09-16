import type { Field } from 'payload';
/**
 * AND an existing Admin `condition` with “sibling[key] === value”.
 * Used so host rule/action fields only show for their `type` / `action`.
 */
export declare function whenSiblingEquals(field: Field, key: string, value: string): Field;
//# sourceMappingURL=whenSibling.d.ts.map
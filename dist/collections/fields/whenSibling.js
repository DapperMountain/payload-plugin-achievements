/**
 * AND an existing Admin `condition` with “sibling[key] === value”.
 * Used so host rule/action fields only show for their `type` / `action`.
 */
export function whenSiblingEquals(field, key, value) {
    const admin = 'admin' in field && field.admin && typeof field.admin === 'object' ? field.admin : {};
    const existing = 'condition' in admin && typeof admin.condition === 'function' ? admin.condition : undefined;
    return {
        ...field,
        admin: {
            ...admin,
            condition: (data, siblingData, ctx) => {
                if (siblingData?.[key] !== value)
                    return false;
                if (!existing)
                    return true;
                return Boolean(existing(data, siblingData, ctx));
            },
        },
    };
}

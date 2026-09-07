/**
 * System catalog rows keep a fixed slug and stay marked system on update
 * so engine lookups by slug cannot be broken from Admin.
 */
export const lockSystemCatalogFields = ({ data, originalDoc, operation }) => {
    if (!data || operation !== 'update')
        return data;
    if (!originalDoc?.system)
        return data;
    data.system = true;
    if (typeof originalDoc.slug === 'string') {
        data.slug = originalDoc.slug;
    }
    return data;
};

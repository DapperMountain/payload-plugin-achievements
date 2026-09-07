/**
 * Display copy for catalog rows. Localized when the host enables Payload `localization`.
 * Slugs stay non-localized identifiers for rules and code.
 */
export function localizedNameField(admin) {
    return {
        name: 'name',
        type: 'text',
        required: true,
        localized: true,
        ...(admin ? { admin } : {}),
    };
}
export function localizedDescriptionField() {
    return {
        name: 'description',
        type: 'textarea',
        localized: true,
    };
}

import type { Field } from 'payload';
/**
 * Display copy for catalog rows. Localized when the host enables Payload `localization`.
 * Slugs stay non-localized identifiers for rules and code.
 */
export declare function localizedNameField(admin?: {
    width?: string;
}): Field;
/** Catalog blurb — Lexical in Admin; seed may still pass plain strings (coerced). */
export declare function localizedDescriptionField(): Field;
//# sourceMappingURL=localizedText.d.ts.map
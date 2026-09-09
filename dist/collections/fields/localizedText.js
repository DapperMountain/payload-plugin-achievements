import { BoldFeature, FixedToolbarFeature, InlineToolbarFeature, ItalicFeature, LinkFeature, OrderedListFeature, ParagraphFeature, UnderlineFeature, UnorderedListFeature, lexicalEditor, } from '@payloadcms/richtext-lexical';
import { plainTextToLexical } from '../../fields/plainTextToLexical.js';
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
/** Catalog blurb — Lexical in Admin; seed may still pass plain strings (coerced). */
export function localizedDescriptionField() {
    return {
        name: 'description',
        type: 'richText',
        localized: true,
        editor: lexicalEditor({
            features: () => [
                ParagraphFeature(),
                BoldFeature(),
                ItalicFeature(),
                UnderlineFeature(),
                UnorderedListFeature(),
                OrderedListFeature(),
                LinkFeature(),
                FixedToolbarFeature(),
                InlineToolbarFeature(),
            ],
        }),
        hooks: {
            beforeValidate: [
                ({ value }) => {
                    if (value == null || value === '')
                        return value;
                    if (typeof value === 'string')
                        return plainTextToLexical(value);
                    return value;
                },
            ],
        },
    };
}

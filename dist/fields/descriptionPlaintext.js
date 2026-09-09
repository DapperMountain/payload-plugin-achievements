import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext';
/**
 * Progress / me APIs expose catalog blurbs as plain strings for search and simple UI.
 * Admin stores Lexical JSON; legacy string rows still work.
 */
export function descriptionToPlaintext(value) {
    if (value == null)
        return undefined;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value !== 'object')
        return undefined;
    try {
        const plaintext = convertLexicalToPlaintext({
            data: value,
        }).trim();
        return plaintext.length > 0 ? plaintext : undefined;
    }
    catch {
        return undefined;
    }
}

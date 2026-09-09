import type { Option } from 'payload';
/**
 * Admin select options for elapsed `since`.
 * Built-in labels are English (same as other plugin Admin chrome).
 * Host anchors pass through Payload {@link OptionLabel} (string, locale map, or `({ t }) => t(…)`).
 */
export declare function elapsedSinceSelectOptions(): Option[];
export declare function isBuiltinElapsedSince(since: string): boolean;
//# sourceMappingURL=elapsedSinceOptions.d.ts.map
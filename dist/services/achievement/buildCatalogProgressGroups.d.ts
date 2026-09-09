export type CatalogProgressItem = {
    id: string;
    name?: string;
    slug?: string;
    /** Same as the achievement collection field (Lexical JSON, or legacy string). */
    description?: unknown;
    completedAt?: string | null;
    earned: boolean;
};
export type CatalogProgressGroup = {
    id: string;
    title: string;
    slug?: string;
    /** Same as the achievement collection field (Lexical JSON, or legacy string). */
    description?: unknown;
    items: CatalogProgressItem[];
};
type CatalogDoc = {
    id: string;
    name?: string;
    slug?: string;
    description?: unknown;
    completionRules?: unknown;
};
type GrantDoc = {
    id: string;
    completedAt?: string | null;
    achievement?: unknown;
};
/**
 * Groups catalog achievements by composite parents (`completionRules`).
 * Children follow completion-rule order. Unearned children stay in the list with `earned: false`.
 */
export declare function buildCatalogProgressGroups(args: {
    achievements: CatalogDoc[];
    grants: GrantDoc[];
}): CatalogProgressGroup[];
export {};
//# sourceMappingURL=buildCatalogProgressGroups.d.ts.map
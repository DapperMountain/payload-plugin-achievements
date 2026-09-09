export type LeafVisitor = (rule: Record<string, unknown>) => void;
/**
 * Visit every leaf in a rule tree.
 * Payload array rows often include empty `rules: []` and a default `combinator` even on
 * leaves — those must still be visited (do not treat them as groups).
 */
export declare function eachRuleLeaf(node: unknown, visit: LeafVisitor): void;
//# sourceMappingURL=eachRuleLeaf.d.ts.map
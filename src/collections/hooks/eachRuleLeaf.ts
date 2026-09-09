export type LeafVisitor = (rule: Record<string, unknown>) => void

/**
 * Visit every leaf in a rule tree.
 * Payload array rows often include empty `rules: []` and a default `combinator` even on
 * leaves — those must still be visited (do not treat them as groups).
 */
export function eachRuleLeaf(node: unknown, visit: LeafVisitor): void {
  if (Array.isArray(node)) {
    for (const item of node) eachRuleLeaf(item, visit)
    return
  }
  if (!node || typeof node !== 'object') return
  const rec = node as Record<string, unknown>
  if (rec.type === 'group') {
    eachRuleLeaf(rec.rules, visit)
    return
  }
  // Top-level `{ combinator, rules }` with no leaf type
  if (!rec.type && Array.isArray(rec.rules)) {
    eachRuleLeaf(rec.rules, visit)
    return
  }
  if (typeof rec.type === 'string') visit(rec)
}

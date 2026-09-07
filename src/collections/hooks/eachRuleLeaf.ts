export type LeafVisitor = (rule: Record<string, unknown>) => void

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
  if (Array.isArray(rec.rules) && (rec.combinator === 'and' || rec.combinator === 'or' || !rec.type)) {
    eachRuleLeaf(rec.rules, visit)
    return
  }
  if (typeof rec.type === 'string') visit(rec)
}

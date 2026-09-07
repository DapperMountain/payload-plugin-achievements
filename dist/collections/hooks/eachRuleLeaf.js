export function eachRuleLeaf(node, visit) {
    if (Array.isArray(node)) {
        for (const item of node)
            eachRuleLeaf(item, visit);
        return;
    }
    if (!node || typeof node !== 'object')
        return;
    const rec = node;
    if (rec.type === 'group') {
        eachRuleLeaf(rec.rules, visit);
        return;
    }
    if (Array.isArray(rec.rules) && (rec.combinator === 'and' || rec.combinator === 'or' || !rec.type)) {
        eachRuleLeaf(rec.rules, visit);
        return;
    }
    if (typeof rec.type === 'string')
        visit(rec);
}

import { type RuleGroup } from './evaluateRules.js';
/**
 * Validate a single rule node (leaf or group). Returns an error message or null.
 * Built-in types require their fields; unknown types are left to host extensions.
 */
export declare function validateRuleNode(rule: Record<string, unknown>): string | null;
/** Walk a top-level rule group (or bare array) and return the first error, if any. */
export declare function validateRuleGroup(input: RuleGroup | Record<string, unknown>[] | null | undefined): string | null;
/** Throw {@link APIError} when rules are incomplete (for collection hooks). */
export declare function assertRuleGroupValid(input: RuleGroup | Record<string, unknown>[] | null | undefined, label: string): void;
//# sourceMappingURL=validateRules.d.ts.map
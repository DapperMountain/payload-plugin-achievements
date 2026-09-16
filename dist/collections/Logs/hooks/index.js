import { ensureTypeRequirements } from './ensureTypeRequirements.js';
import { afterLogChange, afterLogDelete } from './afterLogMutation.js';
export const hooks = {
    beforeValidate: [ensureTypeRequirements],
    afterChange: [afterLogChange],
    afterDelete: [afterLogDelete],
};

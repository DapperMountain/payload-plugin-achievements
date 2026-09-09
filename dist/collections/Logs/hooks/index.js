import { ensureTypeRequirements } from './ensureTypeRequirements.js';
export const hooks = {
    beforeValidate: [ensureTypeRequirements],
};

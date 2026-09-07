import { ensureTypeRequirements } from './ensureTypeRequirements';
export const hooks = {
    beforeValidate: [ensureTypeRequirements],
};

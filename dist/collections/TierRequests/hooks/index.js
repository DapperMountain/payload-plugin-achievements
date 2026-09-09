import { afterTierRequestChange, prepareTierRequest } from './prepareTierRequest.js';
export const hooks = {
    beforeValidate: [prepareTierRequest],
    afterChange: [afterTierRequestChange],
};

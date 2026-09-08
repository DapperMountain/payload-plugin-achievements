import { afterTierRequestChange, prepareTierRequest } from './prepareTierRequest';
export const hooks = {
    beforeValidate: [prepareTierRequest],
    afterChange: [afterTierRequestChange],
};

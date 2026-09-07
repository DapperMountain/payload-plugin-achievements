import type { NumberFieldClientProps } from 'payload';
import React from 'react';
type MetricChangeFieldProps = NumberFieldClientProps & {
    eventTypesSlug: string;
};
/** Signed change amount — only when the type adjusts a metric and a metric is selected. */
export declare function MetricChangeField(props: MetricChangeFieldProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=MetricChangeField.d.ts.map
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldDescription, FieldError, FieldLabel, SelectInput, useField } from '@payloadcms/ui';
import { icons } from 'lucide-react';
import { useMemo } from 'react';
function toKebabCase(pascal) {
    return pascal
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}
function toPascalCase(kebab) {
    return kebab
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
const ICON_OPTIONS = Object.keys(icons)
    .filter((key) => /^[A-Z]/.test(key))
    .map((pascal) => {
    const value = toKebabCase(pascal);
    return { label: value, value };
})
    .sort((a, b) => a.value.localeCompare(b.value));
/**
 * Searchable Lucide icon picker. Stores the kebab-case Lucide name (e.g. `sparkles`).
 */
export const LucideIconField = (props) => {
    const { field, path: pathFromProps, readOnly } = props;
    const path = pathFromProps ?? field?.name ?? 'icon';
    const { errorMessage, setValue, showError, value } = useField({
        path,
    });
    const selected = typeof value === 'string' && value.length > 0 ? value : undefined;
    const PreviewIcon = selected
        ? icons[toPascalCase(selected)]
        : undefined;
    const options = useMemo(() => ICON_OPTIONS, []);
    return (_jsxs("div", { className: "field-type", children: [_jsx(FieldLabel, { label: field?.label ?? 'Icon', path: path, required: Boolean(field?.required) }), _jsxs("div", { style: { alignItems: 'center', display: 'flex', gap: '0.75rem' }, children: [_jsx("div", { "aria-hidden": true, style: {
                            alignItems: 'center',
                            border: '1px solid var(--theme-elevation-150)',
                            borderRadius: 6,
                            display: 'flex',
                            flexShrink: 0,
                            height: 40,
                            justifyContent: 'center',
                            width: 40,
                        }, children: PreviewIcon ? (_jsx(PreviewIcon, { size: 20 })) : (_jsx("span", { style: { color: 'var(--theme-elevation-400)', fontSize: 12 }, children: "\u2014" })) }), _jsx("div", { style: { flex: 1, minWidth: 0 }, children: _jsx(SelectInput, { isClearable: true, name: path, onChange: (option) => {
                                if (Array.isArray(option)) {
                                    setValue(option[0]?.value ?? null);
                                    return;
                                }
                                setValue(option?.value ?? null);
                            }, options: options, path: path, readOnly: Boolean(readOnly), value: selected }) })] }), _jsx(FieldDescription, { description: field?.admin?.description, path: path }), _jsx(FieldError, { message: errorMessage, path: path, showError: showError })] }));
};

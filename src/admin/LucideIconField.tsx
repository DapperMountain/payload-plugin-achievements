'use client'

import type { TextFieldClientComponent, OptionObject } from 'payload'
import { FieldDescription, FieldError, FieldLabel, SelectInput, useField } from '@payloadcms/ui'
import { icons } from 'lucide-react'
import React, { useMemo } from 'react'

function toKebabCase(pascal: string): string {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const ICON_OPTIONS: OptionObject[] = Object.keys(icons)
  .filter((key) => /^[A-Z]/.test(key))
  .map((pascal) => {
    const value = toKebabCase(pascal)
    return { label: value, value }
  })
  .sort((a, b) => a.value.localeCompare(b.value))

/**
 * Searchable Lucide icon picker. Stores the kebab-case Lucide name (e.g. `sparkles`).
 */
export const LucideIconField: TextFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly } = props
  const path = pathFromProps ?? field?.name ?? 'icon'

  const { errorMessage, setValue, showError, value } = useField<string | null | undefined>({
    path,
  })

  const selected = typeof value === 'string' && value.length > 0 ? value : undefined
  const PreviewIcon = selected
    ? icons[toPascalCase(selected) as keyof typeof icons]
    : undefined

  const options = useMemo(() => ICON_OPTIONS, [])

  return (
    <div className="field-type">
      <FieldLabel label={field?.label ?? 'Icon'} path={path} required={Boolean(field?.required)} />
      <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
        <div
          aria-hidden
          style={{
            alignItems: 'center',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            display: 'flex',
            flexShrink: 0,
            height: 40,
            justifyContent: 'center',
            width: 40,
          }}
        >
          {PreviewIcon ? (
            <PreviewIcon size={20} />
          ) : (
            <span style={{ color: 'var(--theme-elevation-400)', fontSize: 12 }}>—</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SelectInput
            isClearable
            name={path}
            onChange={(option) => {
              if (Array.isArray(option)) {
                setValue(option[0]?.value ?? null)
                return
              }
              setValue(option?.value ?? null)
            }}
            options={options}
            path={path}
            readOnly={Boolean(readOnly)}
            value={selected}
          />
        </div>
      </div>
      <FieldDescription description={field?.admin?.description} path={path} />
      <FieldError message={errorMessage} path={path} showError={showError} />
    </div>
  )
}

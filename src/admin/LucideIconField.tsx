'use client'

import type { TextFieldClientComponent } from 'payload'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { icons } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

type IconEntry = {
  name: string
  Icon: (typeof icons)[keyof typeof icons]
}

const ALL_ICONS: IconEntry[] = Object.keys(icons)
  .filter((key) => /^[A-Z]/.test(key))
  .map((pascal) => ({
    name: toKebabCase(pascal),
    Icon: icons[pascal as keyof typeof icons],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const MAX_VISIBLE = 180
const CELL = 36

/**
 * Emoji-picker style Lucide field: searchable icon grid, stores kebab-case names.
 */
export const LucideIconField: TextFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly } = props
  const path = pathFromProps ?? field?.name ?? 'icon'

  const { errorMessage, setValue, showError, value } = useField<string | null | undefined>({
    path,
  })

  const selected = typeof value === 'string' && value.length > 0 ? value : undefined
  const SelectedIcon = selected
    ? icons[toPascalCase(selected) as keyof typeof icons]
    : undefined

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? ALL_ICONS.filter((entry) => entry.name.includes(q))
      : ALL_ICONS
    return list.slice(0, MAX_VISIBLE)
  }, [query])

  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICONS.length
    return ALL_ICONS.filter((entry) => entry.name.includes(q)).length
  }, [query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    queueMicrotask(() => searchRef.current?.focus())
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = useCallback(
    (name: string) => {
      setValue(name)
      setOpen(false)
      setQuery('')
    },
    [setValue],
  )

  const clear = useCallback(() => {
    setValue(null)
    setQuery('')
  }, [setValue])

  return (
    <div className="field-type" ref={rootRef}>
      <FieldLabel label={field?.label ?? 'Icon'} path={path} required={Boolean(field?.required)} />

      <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', position: 'relative' }}>
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          disabled={Boolean(readOnly)}
          onClick={() => setOpen((prev) => !prev)}
          style={{
            alignItems: 'center',
            background: 'var(--theme-input-bg)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s, 4px)',
            color: 'var(--theme-text)',
            cursor: readOnly ? 'default' : 'pointer',
            display: 'inline-flex',
            gap: '0.5rem',
            minHeight: 40,
            minWidth: 160,
            padding: '0 0.75rem',
          }}
          type="button"
        >
          <span
            aria-hidden
            style={{
              alignItems: 'center',
              display: 'inline-flex',
              height: 22,
              justifyContent: 'center',
              width: 22,
            }}
          >
            {SelectedIcon ? (
              <SelectedIcon size={18} />
            ) : (
              <span style={{ color: 'var(--theme-elevation-400)', fontSize: 12 }}>—</span>
            )}
          </span>
          <span style={{ fontSize: 13, opacity: selected ? 1 : 0.55 }}>
            {selected ?? 'Choose icon…'}
          </span>
        </button>

        {selected && !readOnly ? (
          <button
            onClick={clear}
            style={{
              background: 'transparent',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-s, 4px)',
              color: 'var(--theme-elevation-600)',
              cursor: 'pointer',
              fontSize: 12,
              height: 40,
              padding: '0 0.65rem',
            }}
            type="button"
          >
            Clear
          </button>
        ) : null}

        {open && !readOnly ? (
          <div
            role="dialog"
            style={{
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-m, 6px)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              left: 0,
              maxWidth: 'min(360px, 100vw)',
              padding: '0.65rem',
              position: 'absolute',
              top: 'calc(100% + 6px)',
              width: 360,
              zIndex: 40,
            }}
          >
            <input
              aria-label="Search Lucide icons"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search icons…"
              ref={searchRef}
              style={{
                background: 'var(--theme-input-bg)',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: 'var(--style-radius-s, 4px)',
                color: 'var(--theme-text)',
                fontSize: 13,
                marginBottom: '0.5rem',
                padding: '0.45rem 0.6rem',
                width: '100%',
              }}
              type="search"
              value={query}
            />

            <div
              style={{
                display: 'grid',
                gap: 4,
                gridTemplateColumns: `repeat(auto-fill, minmax(${CELL}px, 1fr))`,
                maxHeight: 260,
                overflowY: 'auto',
                paddingBottom: 4,
              }}
            >
              {filtered.map(({ name, Icon }) => {
                const isActive = name === selected
                return (
                  <button
                    key={name}
                    onClick={() => pick(name)}
                    style={{
                      alignItems: 'center',
                      aspectRatio: '1',
                      background: isActive
                        ? 'var(--theme-success-100, var(--theme-elevation-100))'
                        : 'transparent',
                      border: isActive
                        ? '1px solid var(--theme-success-500, var(--theme-elevation-400))'
                        : '1px solid transparent',
                      borderRadius: 6,
                      color: 'var(--theme-text)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    title={name}
                    type="button"
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>

            <div
              style={{
                color: 'var(--theme-elevation-500)',
                fontSize: 11,
                marginTop: 6,
              }}
            >
              {totalMatches === 0
                ? 'No icons match.'
                : totalMatches > MAX_VISIBLE
                  ? `Showing ${MAX_VISIBLE} of ${totalMatches} — refine search`
                  : `${totalMatches} icon${totalMatches === 1 ? '' : 's'}`}
            </div>
          </div>
        ) : null}
      </div>

      <FieldDescription description={field?.admin?.description} path={path} />
      <FieldError message={errorMessage} path={path} showError={showError} />
    </div>
  )
}

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export function durationMs(amount: number, unit: unknown): number | null {
  if (!(typeof amount === 'number') || !Number.isFinite(amount) || amount < 0) return null
  switch (unit) {
    case 'minutes':
      return amount * MS_PER_MINUTE
    case 'hours':
      return amount * MS_PER_HOUR
    case 'days':
    case undefined:
    case null:
    case '':
      return amount * MS_PER_DAY
    default:
      return null
  }
}

export function unitMs(unit: unknown): number | null {
  return durationMs(1, unit ?? 'days')
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  return null
}

/** Whole units elapsed from anchor to `now` (floor). */
export function elapsedUnits(anchor: Date, unit: unknown, now: Date = new Date()): number | null {
  const ms = unitMs(unit)
  if (ms == null || ms <= 0) return null
  const delta = now.getTime() - anchor.getTime()
  if (!Number.isFinite(delta) || delta < 0) return 0
  return Math.floor(delta / ms)
}

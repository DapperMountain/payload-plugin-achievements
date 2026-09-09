import { relationId } from './relationId.js'
import { collectAchievementCompleteRefs } from './evaluateRules.js'

export type CatalogProgressItem = {
  id: string
  name?: string
  slug?: string
  /** Same as the achievement collection field (Lexical JSON, or legacy string). */
  description?: unknown
  completedAt?: string | null
  earned: boolean
}

export type CatalogProgressGroup = {
  id: string
  title: string
  slug?: string
  /** Same as the achievement collection field (Lexical JSON, or legacy string). */
  description?: unknown
  items: CatalogProgressItem[]
}

type CatalogDoc = {
  id: string
  name?: string
  slug?: string
  description?: unknown
  completionRules?: unknown
}

type GrantDoc = {
  id: string
  completedAt?: string | null
  achievement?: unknown
}

function grantKey(achievement: unknown): { id: string | null; slug: string } {
  const id = relationId(achievement)
  const slug =
    achievement && typeof achievement === 'object' && 'slug' in achievement
      ? String((achievement as { slug?: unknown }).slug ?? '')
      : ''
  return { id, slug }
}

function passDescription(value: unknown): unknown | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (value != null && typeof value === 'object') return value
  return undefined
}

/**
 * Groups catalog achievements by composite parents (`completionRules`).
 * Children follow completion-rule order. Unearned children stay in the list with `earned: false`.
 */
export function buildCatalogProgressGroups(args: {
  achievements: CatalogDoc[]
  grants: GrantDoc[]
}): CatalogProgressGroup[] {
  const grantsById = new Map<string, GrantDoc>()
  const grantsBySlug = new Map<string, GrantDoc>()
  for (const grant of args.grants) {
    const key = grantKey(grant.achievement)
    if (key.id) grantsById.set(key.id, grant)
    if (key.slug) grantsBySlug.set(key.slug, grant)
  }

  const byId = new Map(args.achievements.map((doc) => [doc.id, doc]))
  const bySlug = new Map(
    args.achievements
      .filter((doc) => doc.slug)
      .map((doc) => [String(doc.slug), doc]),
  )

  const toItem = (doc: CatalogDoc): CatalogProgressItem => {
    const grant = grantsById.get(doc.id) ?? (doc.slug ? grantsBySlug.get(doc.slug) : undefined)
    const description = passDescription(doc.description)
    return {
      id: doc.id,
      earned: Boolean(grant),
      ...(typeof doc.name === 'string' && doc.name ? { name: doc.name } : {}),
      ...(typeof doc.slug === 'string' && doc.slug ? { slug: doc.slug } : {}),
      ...(description !== undefined ? { description } : {}),
      completedAt: grant?.completedAt ?? null,
    }
  }

  const parents: CatalogDoc[] = []

  for (const doc of args.achievements) {
    const refs = collectAchievementCompleteRefs(doc.completionRules as never)
    if (refs.length === 0) continue
    parents.push(doc)
  }
  const groups: CatalogProgressGroup[] = parents.map((parent) => {
    const refs = collectAchievementCompleteRefs(parent.completionRules as never)
    const items: CatalogProgressItem[] = []
    const seen = new Set<string>()
    for (const ref of refs) {
      const child = (ref.id && byId.get(ref.id)) || (ref.slug ? bySlug.get(ref.slug) : undefined)
      if (!child || seen.has(child.id)) continue
      seen.add(child.id)
      items.push(toItem(child))
    }
    const description = passDescription(parent.description)
    return {
      id: parent.id,
      title: parent.name || parent.slug || parent.id,
      ...(parent.slug ? { slug: parent.slug } : {}),
      ...(description !== undefined ? { description } : {}),
      items,
    }
  })

  return groups
}

import { describe, expect, test } from 'bun:test'
import type { Field } from 'payload'

import { buildAchievementCollections } from '../index.js'
import { resetAchievementOptions, setAchievementOptions, getAchievementOptions } from '../../options-store.js'
import {
  assertSafeRuleArrayDbName,
  buildRuleTreeFields,
  POSTGRES_IDENTIFIER_MAX,
  ruleArrayIdentifierLength,
} from './ruleFields.js'
import { whenSiblingEquals } from './whenSibling.js'

function findTypeSelect(fields: Field[]): Field | undefined {
  for (const field of fields) {
    if (field.type === 'select' && 'name' in field && field.name === 'type') return field
    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findTypeSelect(field.fields as Field[])
      if (nested) return nested
    }
  }
  return undefined
}

function collectArrayDbNames(fields: Field[], into: string[] = []): string[] {
  for (const field of fields) {
    if (field.type === 'array' && 'dbName' in field && typeof field.dbName === 'string') {
      into.push(field.dbName)
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      collectArrayDbNames(field.fields as Field[], into)
    }
    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if ('fields' in tab) collectArrayDbNames(tab.fields as Field[], into)
      }
    }
    if (field.type === 'blocks' && 'blocks' in field) {
      for (const block of field.blocks) {
        collectArrayDbNames(block.fields as Field[], into)
      }
    }
  }
  return into
}

describe('whenSiblingEquals', () => {
  test('hides the field unless the sibling key matches', () => {
    const field = whenSiblingEquals({ name: 'course', type: 'text' }, 'type', 'host.course-complete')
    const condition = field.admin && 'condition' in field.admin ? field.admin.condition : undefined
    expect(typeof condition).toBe('function')
    expect(condition?.({}, { type: 'host.course-complete' })).toBe(true)
    expect(condition?.({}, { type: 'event-count' })).toBe(false)
  })
})

describe('buildRuleTreeFields host types', () => {
  test('merges host rule type options and param fields', () => {
    resetAchievementOptions()
    setAchievementOptions({
      extensions: {
        ruleTypes: [
          {
            type: 'host.course-complete',
            label: 'Course complete',
            fields: [{ name: 'course', type: 'text' }],
            evaluate: () => true,
          },
        ],
      },
    })

    const fields = buildRuleTreeFields({ dbName: 'test_rules' })
    const typeSelect = findTypeSelect(fields)
    const options =
      typeSelect && 'options' in typeSelect && Array.isArray(typeSelect.options) ? typeSelect.options : []
    expect(options).toContainEqual({ label: 'Course complete', value: 'host.course-complete' })

    const rulesArray = fields.find((field) => field.type === 'array' && 'name' in field && field.name === 'rules')
    const rowFields = rulesArray && 'fields' in rulesArray ? (rulesArray.fields as Field[]) : []
    expect(rowFields.some((field) => 'name' in field && field.name === 'course')).toBe(true)

    resetAchievementOptions()
    expect(getAchievementOptions().extensions?.ruleTypes).toBeUndefined()
  })

  test('assigns unique short dbName values for outer and nested rules arrays', () => {
    const fields = buildRuleTreeFields({ dbName: 'ach_elig_r' })
    const outer = fields.find((field) => field.type === 'array' && 'name' in field && field.name === 'rules')
    expect(outer && 'dbName' in outer ? outer.dbName : undefined).toBe('ach_elig_r')

    const nested =
      outer && 'fields' in outer
        ? (outer.fields as Field[]).find(
            (field) => field.type === 'array' && 'name' in field && field.name === 'rules',
          )
        : undefined
    expect(nested && 'dbName' in nested ? nested.dbName : undefined).toBe('ach_elig_r_g')
  })

  test('rejects dbName values that would truncate under Postgres', () => {
    expect(() => assertSafeRuleArrayDbName('this_db_name_is_way_too_long_for_pg')).toThrow(/too long/)
    expect(ruleArrayIdentifierLength('ach_elig_r_g')).toBeLessThanOrEqual(POSTGRES_IDENTIFIER_MAX)
  })
})

describe('plugin rule array dbNames', () => {
  test('every rule-tree array dbName is unique and fits Postgres identifier limits', () => {
    resetAchievementOptions()
    setAchievementOptions({})

    const dbNames = buildAchievementCollections().flatMap((collection) =>
      collectArrayDbNames(collection.fields as Field[]),
    )

    expect(dbNames.length).toBeGreaterThan(0)
    expect(new Set(dbNames).size).toBe(dbNames.length)

    for (const dbName of dbNames) {
      assertSafeRuleArrayDbName(dbName)
    }

    resetAchievementOptions()
  })
})

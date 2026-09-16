import { describe, expect, test } from 'bun:test'
import type { Field } from 'payload'

import { buildRuleTreeFields } from './ruleFields.js'
import { whenSiblingEquals } from './whenSibling.js'
import { getAchievementOptions, resetAchievementOptions, setAchievementOptions } from '../../options-store.js'

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

    const fields = buildRuleTreeFields()
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
})

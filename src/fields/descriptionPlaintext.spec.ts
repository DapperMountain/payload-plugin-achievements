import { describe, expect, test } from 'bun:test'

import { descriptionToPlaintext } from './descriptionPlaintext.js'
import { plainTextToLexical } from './plainTextToLexical.js'

describe('plainTextToLexical / descriptionToPlaintext', () => {
  test('round-trips plain strings through Lexical', () => {
    const lexical = plainTextToLexical('  Hello tier  ')
    expect(descriptionToPlaintext(lexical)).toBe('Hello tier')
  })

  test('passes through legacy plain strings', () => {
    expect(descriptionToPlaintext('Already plain')).toBe('Already plain')
    expect(descriptionToPlaintext('   ')).toBeUndefined()
    expect(descriptionToPlaintext(null)).toBeUndefined()
  })
})

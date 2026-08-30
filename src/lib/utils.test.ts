import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  generateId,
  getRatingStars,
  isValidEmail,
  isValidPhone,
  truncateText,
} from './utils'

describe('utility functions', () => {
  it('formats currency with the requested currency', () => {
    expect(formatCurrency(12.5, 'CNY')).toContain('12.50')
  })

  it('validates common email and Chinese mobile formats', () => {
    expect(isValidEmail('agent@example.com')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidPhone('13800138000')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
  })

  it('truncates only content beyond the limit', () => {
    expect(truncateText('human', 10)).toBe('human')
    expect(truncateText('human api', 5)).toBe('human...')
  })

  it('maps ratings to a five-position star model', () => {
    expect(getRatingStars(3.5)).toEqual([1, 1, 1, 0.5, 0])
    expect(getRatingStars(5)).toEqual([1, 1, 1, 1, 1])
  })

  it('generates non-empty IDs', () => {
    expect(generateId()).toMatch(/^[a-z0-9]+$/)
    expect(generateId()).not.toBe(generateId())
  })
})

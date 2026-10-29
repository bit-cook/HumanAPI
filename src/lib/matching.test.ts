import { describe, expect, it } from 'vitest'

import { hasAllSkills, parseCoordinates, parseSkills } from './matching'

describe('parseSkills', () => {
  it('drops malformed entries instead of throwing', () => {
    expect(
      parseSkills([
        { name: 'a', verified: true },
        { name: 'b' },
        null,
        'oops',
        { name: 42, verified: true },
      ])
    ).toEqual([{ name: 'a', verified: true }])
  })
})

describe('parseCoordinates', () => {
  it('accepts valid coordinates', () => {
    expect(parseCoordinates({ lat: 31.2, lon: 121.5 })).toEqual({
      lat: 31.2,
      lon: 121.5,
    })
  })

  it('rejects out-of-range, non-finite and malformed values', () => {
    expect(parseCoordinates({ lat: 91, lon: 0 })).toBeNull()
    expect(parseCoordinates({ lat: 0, lon: -181 })).toBeNull()
    expect(parseCoordinates({ lat: 'x', lon: 0 })).toBeNull()
    expect(parseCoordinates({ lat: Number.NaN, lon: 0 })).toBeNull()
    expect(parseCoordinates(null)).toBeNull()
    expect(parseCoordinates([31, 121])).toBeNull()
    expect(parseCoordinates({ lat: 31 })).toBeNull()
  })
})

describe('hasAllSkills', () => {
  it('requires every requested skill to be present and verified', () => {
    const skills = [
      { name: 'a', verified: true },
      { name: 'b', verified: false },
    ]
    expect(hasAllSkills(skills, [])).toBe(true)
    expect(hasAllSkills(skills, ['a'])).toBe(true)
    expect(hasAllSkills(skills, ['a', 'b'])).toBe(false)
    expect(hasAllSkills(skills, ['c'])).toBe(false)
  })
})

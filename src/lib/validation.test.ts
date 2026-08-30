import { describe, expect, it } from 'vitest'

import {
  bookingsQuerySchema,
  createBookingSchema,
  createHumanSchema,
  createTaskSchema,
  humansQuerySchema,
  parseJsonBody,
  parseSearchParams,
  parseSkillJson,
  tasksQuerySchema,
} from './validation'

describe('collection route validation', () => {
  it('clamps pagination to safe bounds', () => {
    const tasks = parseSearchParams(
      new URLSearchParams({ page: '-5', limit: '1000' }),
      tasksQuerySchema
    )
    const bookings = parseSearchParams(
      new URLSearchParams({ page: '0', limit: '0' }),
      bookingsQuerySchema
    )

    expect(tasks).toMatchObject({
      success: true,
      data: { page: 1, limit: 100 },
    })
    expect(bookings).toMatchObject({
      success: true,
      data: { page: 1, limit: 1 },
    })
  })

  it('rejects invalid pagination and enum filters', () => {
    expect(
      parseSearchParams(
        new URLSearchParams({ page: '1.5' }),
        tasksQuerySchema
      ).success
    ).toBe(false)
    expect(
      parseSearchParams(
        new URLSearchParams({ status: 'UNKNOWN' }),
        bookingsQuerySchema
      ).success
    ).toBe(false)
  })

  it('requires finite, bounded coordinates and paired lat/lon', () => {
    const invalidQueries: Record<string, string>[] = [
      { lat: 'Infinity', lon: '0' },
      { lat: '91', lon: '0' },
      { lat: '10' },
      { maxDistance: 'NaN' },
    ]

    for (const query of invalidQueries) {
      expect(
        parseSearchParams(new URLSearchParams(query), humansQuerySchema).success
      ).toBe(false)
    }
  })

  it('validates numeric ranges and boolean query values', () => {
    expect(
      parseSearchParams(
        new URLSearchParams({ rateMin: '10', rateMax: '5' }),
        humansQuerySchema
      ).success
    ).toBe(false)
    expect(
      parseSearchParams(
        new URLSearchParams({ ratingMin: '6' }),
        humansQuerySchema
      ).success
    ).toBe(false)
    expect(
      parseSearchParams(
        new URLSearchParams({ availableNow: 'yes' }),
        humansQuerySchema
      ).success
    ).toBe(false)
  })

  it('validates and normalizes task creation bodies', () => {
    const result = createTaskSchema.safeParse({
      agentId: 'agent-1',
      title: '  Site visit  ',
      description: 'Inspect equipment',
      skills: ['inspection'],
      location: { lat: 31.2, lon: 121.5 },
      scheduledTime: '2026-09-01T08:30:00Z',
      estimatedDuration: 60,
      paymentAmount: 100,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Site visit')
      expect(result.data.scheduledTime).toBeInstanceOf(Date)
      expect(result.data).toMatchObject({ currency: 'CNY', priority: 5 })
    }

    expect(
      createTaskSchema.safeParse({
        agentId: 'agent-1',
        title: '',
        description: 'Inspect equipment',
        skills: ['inspection'],
        location: { lat: 31.2, lon: 121.5 },
        estimatedDuration: 0,
        paymentAmount: Number.POSITIVE_INFINITY,
      }).success
    ).toBe(false)
  })

  it('validates human and booking creation bodies', () => {
    expect(
      createHumanSchema.safeParse({
        userId: 'human-1',
        location: { lat: 31.2, lon: 181 },
        skills: [{ name: 'translation', verified: true }],
        hourlyRate: 100,
      }).success
    ).toBe(false)

    expect(
      createBookingSchema.safeParse({
        taskId: 'task-1',
        humanId: 'human-1',
        scheduledTime: '2026-09-01T08:30:00Z',
        estimatedDuration: 60,
        paymentAmount: Number.POSITIVE_INFINITY,
      }).success
    ).toBe(false)
  })

  it('reports malformed JSON as a body validation error', async () => {
    const request = new Request('http://localhost/api/tasks', {
      method: 'POST',
      body: '{',
      headers: { 'content-type': 'application/json' },
    })

    const result = await parseJsonBody(request, createTaskSchema)
    expect(result).toMatchObject({
      success: false,
      error: 'Request body must be valid JSON',
    })
  })

  it('safely ignores malformed skill JSON entries', () => {
    expect(
      parseSkillJson([
        { name: 'translation', verified: true },
        null,
        { name: 42, verified: true },
        { name: 'unsafe' },
      ])
    ).toEqual([{ name: 'translation', verified: true }])
    expect(parseSkillJson({ name: 'not-an-array' })).toEqual([])
  })
})

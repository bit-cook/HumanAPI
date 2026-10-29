import { describe, expect, it } from 'vitest'

import { RateLimiter, rateLimitRuleFromEnv } from '@/lib/rate-limit'

describe('RateLimiter', () => {
  it('allows up to max requests inside a window then rejects', () => {
    const now = 1_000_000
    const limiter = new RateLimiter({ max: 3, windowMs: 60_000, now: () => now })

    expect(limiter.consume('key-a').success).toBe(true)
    expect(limiter.consume('key-a').success).toBe(true)
    expect(limiter.consume('key-a').success).toBe(true)
    const blocked = limiter.consume('key-a')
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('keeps buckets independent per identifier', () => {
    const limiter = new RateLimiter({ max: 2, windowMs: 60_000 })
    expect(limiter.consume('key-a').success).toBe(true)
    expect(limiter.consume('key-a').success).toBe(true)
    expect(limiter.consume('key-a').success).toBe(false)
    expect(limiter.consume('key-b').success).toBe(true)
  })

  it('resets the counter when the window rolls over', () => {
    let now = 0
    const limiter = new RateLimiter({ max: 1, windowMs: 60_000, now: () => now })

    expect(limiter.consume('key').success).toBe(true)
    expect(limiter.consume('key').success).toBe(false)

    now = 60_000
    expect(limiter.consume('key').success).toBe(true)
  })

  it('falls back to safe defaults for invalid options', () => {
    const limiter = new RateLimiter({ max: -5, windowMs: 0 })
    const verdict = limiter.consume('key')
    expect(verdict.success).toBe(true)
    expect(verdict.limit).toBe(120)
  })

  it('clears all buckets on reset', () => {
    const limiter = new RateLimiter({ max: 1, windowMs: 60_000 })
    limiter.consume('key')
    expect(limiter.consume('key').success).toBe(false)
    limiter.reset()
    expect(limiter.consume('key').success).toBe(true)
  })
})

describe('rateLimitRuleFromEnv', () => {
  it('uses defaults when env is absent or invalid', () => {
    expect(rateLimitRuleFromEnv({ NODE_ENV: 'test' })).toEqual({
      max: 120,
      windowMs: 60_000,
    })
    expect(rateLimitRuleFromEnv({ NODE_ENV: 'test', RATE_LIMIT_MAX: 'abc' })).toEqual({
      max: 120,
      windowMs: 60_000,
    })
  })

  it('reads positive overrides from env', () => {
    expect(
      rateLimitRuleFromEnv({
        NODE_ENV: 'test',
        RATE_LIMIT_MAX: '30',
        RATE_LIMIT_WINDOW_MS: '5000',
      })
    ).toEqual({ max: 30, windowMs: 5000 })
  })
})

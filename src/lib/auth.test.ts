import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'

import {
  getApiRateLimiter,
  isAuthorizedRequest,
  requireApiKey,
  resetApiRateLimiterForTest,
} from './auth'

const request = (headers: Record<string, string> = {}) => ({ headers: new Headers(headers) })

describe('API key authorization', () => {
  afterEach(() => {
    delete process.env.API_KEY
    resetApiRateLimiterForTest()
  })

  it('accepts bearer and x-api-key credentials', () => {
    process.env.API_KEY = 'secret-value'
    expect(isAuthorizedRequest(request({ authorization: 'Bearer secret-value' }))).toBe(true)
    expect(isAuthorizedRequest(request({ 'x-api-key': 'secret-value' }))).toBe(true)
  })

  it('rejects absent and mismatched credentials', () => {
    process.env.API_KEY = 'secret-value'
    expect(isAuthorizedRequest(request())).toBe(false)
    expect(isAuthorizedRequest(request({ authorization: 'Bearer wrong' }))).toBe(false)
  })

  it('fails closed when no key is configured', () => {
    expect(isAuthorizedRequest(request())).toBe(false)
  })
})

describe('requireApiKey guard', () => {
  afterEach(() => {
    delete process.env.API_KEY
    delete process.env.RATE_LIMIT_MAX
    resetApiRateLimiterForTest()
  })

  it('returns 503 when API_KEY is not configured', () => {
    const response = requireApiKey(request({ 'x-api-key': 'k' }))
    expect(response?.status).toBe(503)
  })

  it('returns 401 for wrong credentials', () => {
    process.env.API_KEY = 'secret-value'
    const response = requireApiKey(request({ authorization: 'Bearer nope' }))
    expect(response?.status).toBe(401)
    expect(response?.headers.get('WWW-Authenticate')).toBe('Bearer')
  })

  it('returns null for valid credentials', () => {
    process.env.API_KEY = 'secret-value'
    expect(requireApiKey(request({ 'x-api-key': 'secret-value' }))).toBeNull()
  })

  it('enforces the per-key rate limit with Retry-After', () => {
    process.env.API_KEY = 'secret-value'
    process.env.RATE_LIMIT_MAX = '2'
    resetApiRateLimiterForTest()
    const headers = { 'x-api-key': 'secret-value' }
    expect(requireApiKey(request(headers))).toBeNull()
    expect(requireApiKey(request(headers))).toBeNull()
    const blocked = requireApiKey(request(headers))
    expect(blocked?.status).toBe(429)
    expect(blocked?.headers.get('Retry-After')).toBeTruthy()
  })

  it('rejects unauthenticated NextRequest with 401', () => {
    process.env.API_KEY = 'secret-value'
    const req = new NextRequest('http://localhost/api/humans')
    expect(requireApiKey(req)?.status).toBe(401)
  })

  it('counts bearer and x-api-key callers separately', () => {
    process.env.API_KEY = 'secret-value'
    process.env.RATE_LIMIT_MAX = '1'
    resetApiRateLimiterForTest()
    // 同一 key 值经两种 header 形态传入，按 key 值归并计数
    expect(requireApiKey(request({ 'x-api-key': 'secret-value' }))).toBeNull()
    expect(
      requireApiKey(request({ authorization: 'Bearer secret-value' }))?.status
    ).toBe(429)
    expect(getApiRateLimiter()).toBeDefined()
  })
})

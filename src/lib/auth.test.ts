import { afterEach, describe, expect, it } from 'vitest'
import { isAuthorizedRequest } from './auth'

const request = (headers: Record<string, string> = {}) => ({ headers: new Headers(headers) })

describe('API key authorization', () => {
  afterEach(() => {
    delete process.env.API_KEY
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

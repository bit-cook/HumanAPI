import { describe, expect, it, vi } from 'vitest'

import {
  callHumanApi,
  HumanApiRequestError,
  type FetchImplementation,
} from '../src/client.js'

describe('callHumanApi', () => {
  it('sends the expected tool envelope and authorization header', async () => {
    const fetchImplementation = vi.fn<FetchImplementation>(async () =>
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await expect(
      callHumanApi(
        'search_humans',
        { max_distance: 1234 },
        {
          apiUrl: 'https://human.example/api/mcp',
          apiKey: 'test-key',
          fetchImplementation,
        }
      )
    ).resolves.toEqual({ success: true, data: [] })

    const [url, init] = fetchImplementation.mock.calls[0]
    expect(url).toBe('https://human.example/api/mcp')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(init.body))).toEqual({
      tool: 'search_humans',
      arguments: { max_distance: 1234 },
    })
  })

  it('surfaces safe HTTP errors from the HumanAPI response', async () => {
    const fetchImplementation: FetchImplementation = async () =>
      new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
        status: 400,
      })

    const error = await callHumanApi(
      'get_human',
      { id: '' },
      { fetchImplementation }
    ).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(HumanApiRequestError)
    expect((error as HumanApiRequestError).status).toBe(400)
    expect((error as Error).message).toBe(
      'HumanAPI request failed (400): Invalid request'
    )
  })

  it('aborts requests that exceed the configured timeout', async () => {
    const fetchImplementation: FetchImplementation = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })

    await expect(
      callHumanApi('list_skills', {}, { timeoutMs: 1, fetchImplementation })
    ).rejects.toThrow('HumanAPI request timed out after 1ms')
  })

  it('normalizes network failures', async () => {
    const fetchImplementation: FetchImplementation = async () => {
      throw new TypeError('connection refused')
    }

    await expect(
      callHumanApi('list_skills', {}, { fetchImplementation })
    ).rejects.toThrow('Unable to reach HumanAPI: connection refused')
  })
})

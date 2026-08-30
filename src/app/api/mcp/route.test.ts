import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findAvailableHumans: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ prisma: {} }))
vi.mock('@/lib/matching', () => ({
  findAvailableHumans: mocks.findAvailableHumans,
}))

import { POST } from './route'

function createRequest(body: string, headers?: HeadersInit) {
  return new NextRequest('http://localhost:3000/api/mcp', {
    method: 'POST',
    body,
    headers,
  })
}

describe('MCP HTTP route', () => {
  beforeEach(() => {
    delete process.env.MCP_API_KEY
    mocks.findAvailableHumans.mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    delete process.env.MCP_API_KEY
  })

  it('parses one tool envelope and forwards max_distance', async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'search_humans',
          arguments: { max_distance: 2_500, available_now: false },
        })
      )
    )

    expect(response.status).toBe(200)
    expect(mocks.findAvailableHumans).toHaveBeenCalledWith(
      expect.objectContaining({ maxDistance: 2_500, availableNow: false })
    )
  })

  it('returns safe 400 responses for invalid JSON, tools, and arguments', async () => {
    const invalidJson = await POST(createRequest('{'))
    expect(invalidJson.status).toBe(400)
    await expect(invalidJson.json()).resolves.toEqual({
      success: false,
      error: 'Request body must be valid JSON',
    })

    for (const body of [
      { tool: 'drop_database', arguments: {} },
      { tool: 'get_human', arguments: { id: '' } },
    ]) {
      const response = await POST(createRequest(JSON.stringify(body)))
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        success: false,
        error: 'Invalid MCP request',
      })
    }
  })

  it('optionally enforces Bearer or x-api-key authentication', async () => {
    const body = JSON.stringify({ tool: 'search_humans', arguments: {} })
    expect((await POST(createRequest(body))).status).toBe(200)

    process.env.MCP_API_KEY = 'secret-key'
    expect((await POST(createRequest(body))).status).toBe(401)
    expect(
      (await POST(createRequest(body, { authorization: 'Bearer secret-key' }))).status
    ).toBe(200)
    expect(
      (await POST(createRequest(body, { 'x-api-key': 'secret-key' }))).status
    ).toBe(200)
  })
})

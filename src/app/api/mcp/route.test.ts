import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findAvailableHumans: vi.fn(),
  runTransaction: vi.fn(),
  userFindUnique: vi.fn(),
  humanProfileFindUnique: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  bookingCreate: vi.fn(),
  bookingFindUnique: vi.fn(),
  bookingUpdateMany: vi.fn(),
  bookingFindUniqueOrThrow: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: mocks.runTransaction,
  },
}))
vi.mock('@/lib/matching', () => ({
  findAvailableHumans: mocks.findAvailableHumans,
}))

import { POST } from './route'

function createRequest(
  body: string,
  headers: HeadersInit = { 'x-api-key': 'secret-key' }
) {
  return new NextRequest('http://localhost:3000/api/mcp', {
    method: 'POST',
    body,
    headers,
  })
}

describe('MCP HTTP route', () => {
  beforeEach(() => {
    process.env.API_KEY = 'secret-key'
    vi.clearAllMocks()
    mocks.findAvailableHumans.mockReset().mockResolvedValue([])
    mocks.runTransaction.mockImplementation(
      async (
        callback: (transaction: {
          user: { findUnique: typeof mocks.userFindUnique }
          humanProfile: { findUnique: typeof mocks.humanProfileFindUnique }
          task: {
            create: typeof mocks.taskCreate
            update: typeof mocks.taskUpdate
          }
          booking: {
            create: typeof mocks.bookingCreate
            findUnique: typeof mocks.bookingFindUnique
            updateMany: typeof mocks.bookingUpdateMany
            findUniqueOrThrow: typeof mocks.bookingFindUniqueOrThrow
          }
        }) => Promise<unknown>
      ) =>
        callback({
          user: { findUnique: mocks.userFindUnique },
          humanProfile: { findUnique: mocks.humanProfileFindUnique },
          task: { create: mocks.taskCreate, update: mocks.taskUpdate },
          booking: {
            create: mocks.bookingCreate,
            findUnique: mocks.bookingFindUnique,
            updateMany: mocks.bookingUpdateMany,
            findUniqueOrThrow: mocks.bookingFindUniqueOrThrow,
          },
        })
    )
  })

  afterEach(() => {
    delete process.env.API_KEY
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

  it('fails closed and accepts Bearer or x-api-key authentication', async () => {
    const body = JSON.stringify({ tool: 'search_humans', arguments: {} })
    expect((await POST(createRequest(body, {}))).status).toBe(401)
    expect(
      (await POST(createRequest(body, { authorization: 'Bearer secret-key' }))).status
    ).toBe(200)
    expect(
      (await POST(createRequest(body, { 'x-api-key': 'secret-key' }))).status
    ).toBe(200)
  })

  it('checks availability and creates the task and booking in one transaction', async () => {
    const scheduledTime = '2026-09-01T10:00:00.000Z'
    mocks.userFindUnique.mockResolvedValue({ id: 'agent-1', role: 'AGENT' })
    mocks.humanProfileFindUnique.mockResolvedValue({
      available: true,
      verified: true,
      user: { id: 'human-user-1', name: 'Human One' },
    })
    mocks.taskCreate.mockResolvedValue({ id: 'task-1' })
    mocks.bookingCreate.mockResolvedValue({
      id: 'booking-1',
      taskId: 'task-1',
      agentId: 'agent-1',
      scheduledTime: new Date(scheduledTime),
      estimatedDuration: 60,
      paymentAmount: 100,
      currency: 'CNY',
      status: 'PENDING',
    })

    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'book_human',
          arguments: {
            human_id: 'profile-1',
            agent_id: 'agent-1',
            task_description: 'Attend a site visit',
            task_location: { lat: 31.2, lon: 121.5 },
            scheduled_time: scheduledTime,
            estimated_duration: 60,
            payment_amount: 100,
          },
        })
      )
    )

    expect(response.status).toBe(201)
    expect(mocks.runTransaction).toHaveBeenCalledOnce()
    expect(mocks.taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agentId: 'agent-1',
        humanId: 'human-user-1',
        status: 'ASSIGNED',
      }),
    })
    expect(mocks.bookingCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        taskId: 'task-1',
        agentId: 'agent-1',
        humanId: 'human-user-1',
        status: 'PENDING',
      }),
    })
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        booking_id: 'booking-1',
        task_id: 'task-1',
        human_id: 'profile-1',
      },
    })
  })

  it('rejects an unavailable human before creating task or booking records', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'agent-1', role: 'AGENT' })
    mocks.humanProfileFindUnique.mockResolvedValue({
      available: false,
      verified: true,
      user: { id: 'human-user-1', name: 'Human One' },
    })

    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'book_human',
          arguments: {
            human_id: 'profile-1',
            agent_id: 'agent-1',
            task_description: 'Attend a site visit',
            task_location: { lat: 31.2, lon: 121.5 },
            scheduled_time: '2026-09-01T10:00:00.000Z',
            estimated_duration: 60,
            payment_amount: 100,
          },
        })
      )
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Human is not verified and available',
    })
    expect(mocks.taskCreate).not.toHaveBeenCalled()
    expect(mocks.bookingCreate).not.toHaveBeenCalled()
  })

  it('uses booking.taskId and updates booking and task in one transaction', async () => {
    const updatedAt = new Date('2026-09-01T11:00:00.000Z')
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'IN_PROGRESS',
      taskId: 'persisted-task-id',
    })
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 })
    mocks.bookingFindUniqueOrThrow.mockResolvedValue({
      id: 'booking-1',
      status: 'COMPLETED',
      updatedAt,
    })
    mocks.taskUpdate.mockResolvedValue({ id: 'persisted-task-id' })

    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'update_booking',
          arguments: {
            id: 'booking-1',
            status: 'COMPLETED',
            proof: 'Site visit completed',
          },
        })
      )
    )

    expect(response.status).toBe(200)
    expect(mocks.runTransaction).toHaveBeenCalledOnce()
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: 'IN_PROGRESS' },
      data: expect.objectContaining({
        status: 'COMPLETED',
        completionProof: 'Site visit completed',
        completedAt: expect.any(Date),
      }),
    })
    expect(mocks.taskUpdate).toHaveBeenCalledWith({
      where: { id: 'persisted-task-id' },
      data: expect.objectContaining({
        status: 'COMPLETED',
        completedAt: expect.any(Date),
      }),
    })
  })

  it('rejects invalid booking state transitions without writing records', async () => {
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'PENDING',
      taskId: 'task-1',
    })

    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'update_booking',
          arguments: { id: 'booking-1', status: 'COMPLETED' },
        })
      )
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      success: false,
      error: 'Cannot transition booking from PENDING to COMPLETED',
    })
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled()
    expect(mocks.taskUpdate).not.toHaveBeenCalled()
  })
})

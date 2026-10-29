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
  reviewCreate: vi.fn(),
  reviewAggregate: vi.fn(),
  userUpdate: vi.fn(),
  messageCreate: vi.fn(),
  disputeFindFirst: vi.fn(),
  disputeCreate: vi.fn(),
  disputeFindUnique: vi.fn(),
  disputeUpdate: vi.fn(),
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
        callback: (transaction: Record<string, unknown>) => Promise<unknown>
      ) =>
        callback({
          user: {
            findUnique: mocks.userFindUnique,
            update: mocks.userUpdate,
          },
          humanProfile: { findUnique: mocks.humanProfileFindUnique },
          task: { create: mocks.taskCreate, update: mocks.taskUpdate },
          booking: {
            create: mocks.bookingCreate,
            findUnique: mocks.bookingFindUnique,
            updateMany: mocks.bookingUpdateMany,
            findUniqueOrThrow: mocks.bookingFindUniqueOrThrow,
          },
          review: {
            create: mocks.reviewCreate,
            aggregate: mocks.reviewAggregate,
          },
          message: { create: mocks.messageCreate },
          dispute: {
            findFirst: mocks.disputeFindFirst,
            findUnique: mocks.disputeFindUnique,
            create: mocks.disputeCreate,
            update: mocks.disputeUpdate,
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
      userId: 'human-user-1',
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
      userId: 'human-user-1',
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

  it('create_review aggregates the reviewee rating inside the transaction', async () => {
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'COMPLETED',
      agentId: 'agent-1',
      humanId: 'human-user-1',
    })
    mocks.reviewCreate.mockResolvedValue({ id: 'review-1', rating: 4 })
    mocks.reviewAggregate.mockResolvedValue({
      _avg: { rating: 4.25 },
      _count: { _all: 2 },
    })
    mocks.userUpdate.mockResolvedValue({ id: 'human-user-1' })

    const response = await POST(
      createRequest(
        JSON.stringify({
          tool: 'create_review',
          arguments: {
            booking_id: 'booking-1',
            reviewer_id: 'agent-1',
            rating: 4,
            comment: 'well done',
          },
        })
      )
    )

    expect(response.status).toBe(201)
    expect(mocks.reviewCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'booking-1',
        reviewerId: 'agent-1',
        revieweeId: 'human-user-1',
        rating: 4,
        comment: 'well done',
      }),
    })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'human-user-1' },
      data: { rating: 4.25, totalReviews: 2 },
    })
  })

  it('create_review rejects non-completed bookings and strangers', async () => {
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'PENDING',
      agentId: 'agent-1',
      humanId: 'human-user-1',
    })

    const pending = await POST(
      createRequest(
        JSON.stringify({
          tool: 'create_review',
          arguments: { booking_id: 'b', reviewer_id: 'agent-1', rating: 5 },
        })
      )
    )
    expect(pending.status).toBe(409)
    expect(mocks.reviewCreate).not.toHaveBeenCalled()

    mocks.bookingFindUnique.mockResolvedValue({
      status: 'COMPLETED',
      agentId: 'agent-1',
      humanId: 'human-user-1',
    })
    const stranger = await POST(
      createRequest(
        JSON.stringify({
          tool: 'create_review',
          arguments: { booking_id: 'b', reviewer_id: 'someone-else', rating: 5 },
        })
      )
    )
    expect(stranger.status).toBe(403)
  })

  it('create_dispute moves the booking to DISPUTED and blocks duplicates', async () => {
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'CONFIRMED',
      agentId: 'agent-1',
      humanId: 'human-user-1',
    })
    mocks.disputeFindFirst.mockResolvedValue(null)
    mocks.disputeCreate.mockResolvedValue({ id: 'dispute-1' })

    const created = await POST(
      createRequest(
        JSON.stringify({
          tool: 'create_dispute',
          arguments: {
            booking_id: 'booking-1',
            reporter_id: 'agent-1',
            reason: 'no show',
            description: 'expert never arrived',
          },
        })
      )
    )
    expect(created.status).toBe(201)

    mocks.disputeFindFirst.mockResolvedValue({ id: 'dispute-0' })
    const duplicate = await POST(
      createRequest(
        JSON.stringify({
          tool: 'create_dispute',
          arguments: {
            booking_id: 'booking-1',
            reporter_id: 'agent-1',
            reason: 'again',
            description: 'again',
          },
        })
      )
    )
    expect(duplicate.status).toBe(409)
  })

  it('resolve_dispute closes an open dispute once', async () => {
    mocks.disputeFindUnique.mockResolvedValue({ status: 'OPEN' })
    mocks.disputeUpdate.mockResolvedValue({ id: 'dispute-1', status: 'RESOLVED' })

    const resolved = await POST(
      createRequest(
        JSON.stringify({
          tool: 'resolve_dispute',
          arguments: {
            id: 'dispute-1',
            status: 'RESOLVED',
            resolution: 'refunded',
          },
        })
      )
    )
    expect(resolved.status).toBe(200)
    expect(mocks.disputeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RESOLVED',
          humanResolution: 'refunded',
          resolvedAt: expect.any(Date),
        }),
      })
    )

    mocks.disputeFindUnique.mockResolvedValue({ status: 'RESOLVED' })
    const again = await POST(
      createRequest(
        JSON.stringify({
          tool: 'resolve_dispute',
          arguments: { id: 'dispute-1', status: 'REJECTED' },
        })
      )
    )
    expect(again.status).toBe(409)
  })

  it('send_message enforces booking participants', async () => {
    mocks.bookingFindUnique.mockResolvedValue({
      status: 'CONFIRMED',
      agentId: 'agent-1',
      humanId: 'human-user-1',
    })
    mocks.messageCreate.mockResolvedValue({ id: 'message-1' })

    const ok = await POST(
      createRequest(
        JSON.stringify({
          tool: 'send_message',
          arguments: {
            booking_id: 'booking-1',
            sender_id: 'agent-1',
            recipient_id: 'human-user-1',
            content: 'on my way',
          },
        })
      )
    )
    expect(ok.status).toBe(201)

    const stranger = await POST(
      createRequest(
        JSON.stringify({
          tool: 'send_message',
          arguments: {
            booking_id: 'booking-1',
            sender_id: 'agent-1',
            recipient_id: 'outsider',
            content: 'hi',
          },
        })
      )
    )
    expect(stranger.status).toBe(403)
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

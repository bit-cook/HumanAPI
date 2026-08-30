import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const transaction = {
    task: {
      findUnique: vi.fn(async (): Promise<unknown> => null),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    humanProfile: {
      findUnique: vi.fn(async (): Promise<unknown> => null),
    },
    booking: {
      create: vi.fn(async (): Promise<unknown> => null),
    },
  }

  return {
    transaction,
    prisma: {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction)
      ),
      booking: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  }
})

vi.mock('@/lib/db', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ requireApiKey: () => null }))

import { POST } from './route'

function bookingRequest(body: unknown) {
  return new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  taskId: 'task-1',
  humanId: 'human-1',
  scheduledTime: '2026-09-01T08:30:00Z',
  estimatedDuration: 60,
}

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns the task and creates the booking in one transaction', async () => {
    mocks.transaction.task.findUnique.mockResolvedValue({
      agentId: 'agent-1',
      currency: 'CNY',
      paymentAmount: 100,
      status: 'OPEN',
      humanId: null,
      booking: null,
    })
    mocks.transaction.humanProfile.findUnique.mockResolvedValue({
      userId: 'human-1',
      verified: true,
      available: true,
    })
    mocks.transaction.task.updateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.booking.create.mockResolvedValue({ id: 'booking-1' })

    const response = await POST(bookingRequest(validBody))

    expect(response.status).toBe(201)
    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce()
    expect(mocks.transaction.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN', humanId: null }),
        data: { humanId: 'human-1', status: 'ASSIGNED' },
      })
    )
    expect(mocks.transaction.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentAmount: 100 }),
      })
    )
    expect(
      mocks.transaction.task.updateMany.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mocks.transaction.booking.create.mock.invocationCallOrder[0]
    )
  })

  it('rejects a non-open or previously booked task', async () => {
    mocks.transaction.task.findUnique.mockResolvedValue({
      agentId: 'agent-1',
      currency: 'CNY',
      paymentAmount: 100,
      status: 'ASSIGNED',
      humanId: 'human-2',
      booking: { id: 'existing-booking' },
    })

    const response = await POST(bookingRequest(validBody))

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Task is not open or has already been booked',
    })
    expect(mocks.transaction.task.updateMany).not.toHaveBeenCalled()
    expect(mocks.transaction.booking.create).not.toHaveBeenCalled()
  })

  it('returns a useful 400 without starting a transaction', async () => {
    const response = await POST(
      bookingRequest({ ...validBody, estimatedDuration: -1 })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Invalid request body',
      details: [
        expect.objectContaining({ field: 'estimatedDuration' }),
      ],
    })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })
})

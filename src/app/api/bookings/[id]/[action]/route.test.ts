import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  bookingFindUnique: vi.fn(),
  bookingUpdateMany: vi.fn(),
  bookingFindFinal: vi.fn(),
  taskUpdate: vi.fn(),
  humanUpdate: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireApiKey: () => null }))
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { POST } from './route'

function request(body?: string) {
  return new NextRequest('http://localhost/api/bookings/booking-1/complete', {
    method: 'POST',
    ...(body === undefined ? {} : { body, headers: { 'content-type': 'application/json' } }),
  })
}

const context = {
  params: Promise.resolve({ id: 'booking-1', action: 'complete' }),
}

describe('booking action route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        booking: {
          findUnique: mocks.bookingFindUnique
            .mockResolvedValueOnce({
              status: 'IN_PROGRESS',
              taskId: 'task-1',
              humanId: 'human-1',
            })
            .mockImplementation(mocks.bookingFindFinal),
          updateMany: mocks.bookingUpdateMany,
        },
        task: { update: mocks.taskUpdate },
        humanProfile: { update: mocks.humanUpdate },
      })
    )
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 })
    mocks.bookingFindFinal.mockResolvedValue({
      id: 'booking-1',
      status: 'COMPLETED',
      paymentStatus: 'PENDING',
    })
  })

  it('accepts an empty completion body and conditionally changes state', async () => {
    const response = await POST(request(), context)

    expect(response.status).toBe(200)
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: 'IN_PROGRESS' },
      data: expect.objectContaining({ status: 'COMPLETED', completedAt: expect.any(Date) }),
    })
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).not.toHaveProperty(
      'paymentStatus'
    )
    expect(mocks.humanUpdate).toHaveBeenCalledOnce()
  })

  it('rejects a concurrent state change before updating related records', async () => {
    mocks.bookingUpdateMany.mockResolvedValue({ count: 0 })
    const response = await POST(request('{}'), context)

    expect(response.status).toBe(409)
    expect(mocks.taskUpdate).not.toHaveBeenCalled()
    expect(mocks.humanUpdate).not.toHaveBeenCalled()
  })
})

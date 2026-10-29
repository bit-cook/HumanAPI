import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { createDisputeSchema, parseJsonBody } from '@/lib/validation'
import { HttpError, httpErrorResponse } from '@/lib/api-error'
import { getBookingTransition } from '@/lib/booking-state'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/bookings/:id/disputes - 对预约发起争议，并将 booking 置为 DISPUTED
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, createDisputeSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { reporterId, reason, description, evidence } = parsed.data

    const dispute = await prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.findUnique({
        where: { id },
        select: { status: true, agentId: true, humanId: true },
      })
      if (!booking) throw new HttpError('Booking not found', 404)
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
        throw new HttpError('Booking is already closed', 409)
      }
      if (reporterId !== booking.agentId && reporterId !== booking.humanId) {
        throw new HttpError(
          'Reporter must be the agent or human of this booking',
          403
        )
      }

      const existing = await transaction.dispute.findFirst({
        where: { bookingId: id, status: 'OPEN' },
        select: { id: true },
      })
      if (existing) {
        throw new HttpError('An open dispute already exists', 409)
      }

      // DISPUTED 迁移复用状态机：仅允许从非终态发起
      if (!getBookingTransition('dispute', booking.status)) {
        throw new HttpError('Booking cannot be disputed', 409)
      }

      const created = await transaction.dispute.create({
        data: {
          bookingId: id,
          reporterId,
          reason,
          description,
          ...(evidence
            ? { evidence: evidence as unknown as Prisma.InputJsonValue }
            : {}),
        },
        include: {
          reporter: { select: { id: true, name: true, avatar: true } },
        },
      })

      await transaction.booking.updateMany({
        where: { id, status: booking.status },
        data: { status: 'DISPUTED' },
      })

      return created
    })

    return NextResponse.json({ success: true, data: dispute }, { status: 201 })
  } catch (error) {
    return httpErrorResponse(error)
  }
}

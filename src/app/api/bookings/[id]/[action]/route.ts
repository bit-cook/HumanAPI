import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireApiKey } from '@/lib/auth'
import {
  bookingActions,
  getBookingTransition,
  type BookingAction,
} from '@/lib/booking-state'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string; action: string }>
}

const actionSchema = z.enum(bookingActions)
const completionSchema = z
  .object({
    completionProof: z.string().trim().min(1).max(10_000).optional(),
    actualDuration: z.number().int().positive().max(10_080).optional(),
  })
  .strict()
const disputeSchema = z
  .object({
    reason: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5_000).optional(),
  })
  .strict()

async function parseOptionalJson(
  request: NextRequest,
  schema: z.ZodTypeAny,
  invalidMessage: string
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    const text = await request.text()
    return { ok: true, data: text ? schema.parse(JSON.parse(text)) : {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: invalidMessage },
          { status: 400 }
        ),
      }
    }
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Request body must be valid JSON' },
        { status: 400 }
      ),
    }
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  const { id, action: rawAction } = await context.params
  const parsedAction = actionSchema.safeParse(rawAction)
  if (!parsedAction.success) {
    return NextResponse.json(
      { success: false, error: 'Unknown booking action' },
      { status: 404 }
    )
  }

  const action: BookingAction = parsedAction.data
  let completion: z.infer<typeof completionSchema> = {}
  let dispute: Partial<z.infer<typeof disputeSchema>> = {}

  if (action === 'complete' || action === 'resolve') {
    const parsedBody = await parseOptionalJson(
      request,
      completionSchema,
      'Invalid completion data'
    )
    if (!parsedBody.ok) return parsedBody.response
    completion = parsedBody.data as z.infer<typeof completionSchema>
  }

  if (action === 'dispute') {
    const parsedBody = await parseOptionalJson(
      request,
      disputeSchema,
      'Invalid dispute data'
    )
    if (!parsedBody.ok) return parsedBody.response
    dispute = parsedBody.data as z.infer<typeof disputeSchema>
  }

  try {
    const booking = await prisma.$transaction(async (transaction) => {
      const current = await transaction.booking.findUnique({
        where: { id },
        select: { status: true, taskId: true, humanId: true, agentId: true },
      })
      if (!current) return null

      const transition = getBookingTransition(action, current.status)
      if (!transition) throw new Error('INVALID_TRANSITION')

      const now = new Date()
      const bookingData = {
        status: transition.booking,
        ...(action === 'start' ? { startedAt: now } : {}),
        ...(action === 'complete' || action === 'resolve'
          ? { completedAt: now, ...completion }
          : {}),
      }

      const changed = await transaction.booking.updateMany({
        where: { id, status: current.status },
        data: bookingData,
      })
      if (changed.count !== 1) throw new Error('INVALID_TRANSITION')

      if (transition.task) {
        await transaction.task.update({
          where: { id: current.taskId },
          data: {
            status: transition.task,
            ...(transition.countsCompletion ? { completedAt: now } : {}),
          },
        })
      }

      if (action === 'dispute' && dispute.reason) {
        // 快捷争议：与 POST /api/bookings/:id/disputes 等价
        const existing = await transaction.dispute.findFirst({
          where: { bookingId: id, status: 'OPEN' },
          select: { id: true },
        })
        if (!existing) {
          await transaction.dispute.create({
            data: {
              bookingId: id,
              reporterId: current.agentId,
              reason: dispute.reason,
              description: dispute.description ?? dispute.reason,
            },
          })
        }
      }

      if (transition.countsCompletion) {
        await transaction.humanProfile.update({
          where: { userId: current.humanId },
          data: { totalTasks: { increment: 1 } },
        })
      }

      return transaction.booking.findUnique({ where: { id } })
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_TRANSITION') {
      return NextResponse.json(
        { success: false, error: 'Invalid booking state transition' },
        { status: 409 }
      )
    }
    console.error('Booking action failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

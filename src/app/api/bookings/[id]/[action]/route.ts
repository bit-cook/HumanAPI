import { Prisma } from '@prisma/client'
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

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  const { id, action: rawAction } = await context.params
  const parsedAction = actionSchema.safeParse(rawAction)
  if (!parsedAction.success) {
    return NextResponse.json({ success: false, error: 'Unknown booking action' }, { status: 404 })
  }

  const action: BookingAction = parsedAction.data
  let completion: z.infer<typeof completionSchema> = {}
  if (action === 'complete') {
    try {
      const text = await request.text()
      completion = completionSchema.parse(text ? JSON.parse(text) : {})
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: 'Invalid completion data' }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 })
    }
  }

  try {
    const booking = await prisma.$transaction(async (transaction) => {
      const current = await transaction.booking.findUnique({
        where: { id },
        select: { status: true, taskId: true, humanId: true },
      })
      if (!current) return null

      const transition = getBookingTransition(action, current.status)
      if (!transition) throw new Error('INVALID_TRANSITION')

      const now = new Date()
      const changed = await transaction.booking.updateMany({
        where: { id, status: current.status },
        data: {
          status: transition.booking,
          ...(action === 'start' ? { startedAt: now } : {}),
          ...(action === 'complete' ? { completedAt: now, ...completion } : {}),
        },
      })
      if (changed.count !== 1) throw new Error('INVALID_TRANSITION')
      await transaction.task.update({
        where: { id: current.taskId },
        data: {
          status: transition.task,
          ...(action === 'complete' ? { completedAt: now } : {}),
        },
      })
      if (action === 'complete') {
        await transaction.humanProfile.update({
          where: { userId: current.humanId },
          data: { totalTasks: { increment: 1 } },
        })
      }
      return transaction.booking.findUnique({ where: { id } })
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_TRANSITION') {
      return NextResponse.json({ success: false, error: 'Invalid booking state transition' }, { status: 409 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Related record not found' }, { status: 409 })
    }
    console.error('Booking action failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}

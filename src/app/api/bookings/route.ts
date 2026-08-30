import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  bookingsQuerySchema,
  createBookingSchema,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/validation'
import { Prisma } from '@prisma/client'
import { requireApiKey } from '@/lib/auth'

class TaskNotFoundError extends Error {}
class HumanNotFoundError extends Error {}
class TaskUnavailableError extends Error {}

/**
 * GET /api/bookings - 获取预订列表
 */
export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, bookingsQuerySchema)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { agentId, humanId, status, page, limit } = parsed.data
    const where: Prisma.BookingWhereInput = {}

    if (agentId) {
      where.agentId = agentId
    }

    if (humanId) {
      where.humanId = humanId
    }

    if (status) {
      where.status = status
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          task: {
            include: {
              agent: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true,
            },
          },
          human: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings - 创建预订
 */
export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized
    const parsed = await parseJsonBody(request, createBookingSchema)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const {
      taskId,
      humanId,
      scheduledTime,
      estimatedDuration,
    } = parsed.data

    const booking = await prisma.$transaction(async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: taskId },
        select: {
          agentId: true,
          currency: true,
          paymentAmount: true,
          status: true,
          humanId: true,
          booking: { select: { id: true } },
        },
      })

      if (!task) throw new TaskNotFoundError()
      if (task.status !== 'OPEN' || task.humanId !== null || task.booking) {
        throw new TaskUnavailableError()
      }

      const human = await transaction.humanProfile.findUnique({
        where: { userId: humanId },
        select: { userId: true, verified: true, available: true },
      })
      if (!human || !human.verified || !human.available) {
        throw new HumanNotFoundError()
      }

      const assignment = await transaction.task.updateMany({
        where: {
          id: taskId,
          status: 'OPEN',
          humanId: null,
          booking: { is: null },
        },
        data: { humanId, status: 'ASSIGNED' },
      })

      if (assignment.count !== 1) throw new TaskUnavailableError()

      return transaction.booking.create({
        data: {
          taskId,
          agentId: task.agentId,
          humanId,
          scheduledTime,
          estimatedDuration,
          paymentAmount: task.paymentAmount,
          currency: task.currency,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        include: {
          task: true,
          agent: { select: { id: true, name: true, avatar: true } },
          human: { select: { id: true, name: true, avatar: true } },
        },
      })
    })

    // 发送通知（实际实现需要集成通知系统）
    console.log(`Booking created: ${booking.id}`)

    return NextResponse.json(
      {
        success: true,
        data: booking,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    if (error instanceof HumanNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'Human not found' },
        { status: 404 }
      )
    }

    if (
      error instanceof TaskUnavailableError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002')
    ) {
      return NextResponse.json(
        { success: false, error: 'Task is not open or has already been booked' },
        { status: 409 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
      },
      { status: 500 }
    )
  }
}

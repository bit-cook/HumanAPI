import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/bookings/:id - 获取预订详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            agent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        human: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        reviews: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/bookings/:id - 更新预订
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const booking = await prisma.booking.update({
      where: { id },
      data: body,
      include: {
        task: true,
        agent: true,
        human: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings/:id/confirm - 确认预订
 */
export async function POST_confirm(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        task: true,
        agent: true,
        human: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm booking',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings/:id/start - 开始任务
 */
export async function POST_start(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        task: true,
      },
    })

    // 更新任务状态
    await prisma.task.update({
      where: { id: booking.taskId },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error starting booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start booking',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings/:id/complete - 完成任务
 */
export async function POST_complete(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { completionProof, actualDuration } = body

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionProof,
        actualDuration,
        paymentStatus: 'PAID',
      },
      include: {
        task: true,
        agent: true,
        human: true,
      },
    })

    // 更新任务状态
    await prisma.task.update({
      where: { id: booking.taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // 更新人类专家统计
    await prisma.humanProfile.update({
      where: { userId: booking.humanId },
      data: {
        totalTasks: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error completing booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete booking',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings/:id/cancel - 取消预订
 */
export async function POST_cancel(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
      },
      include: {
        task: true,
      },
    })

    // 更新任务状态
    await prisma.task.update({
      where: { id: booking.taskId },
      data: {
        status: 'CANCELLED',
      },
    })

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel booking',
      },
      { status: 500 }
    )
  }
}

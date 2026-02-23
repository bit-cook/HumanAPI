import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/bookings - 获取预订列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const humanId = searchParams.get('humanId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

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
    const body = await request.json()
    const {
      taskId,
      humanId,
      scheduledTime,
      estimatedDuration,
      paymentAmount,
    } = body

    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        agent: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      )
    }

    // 创建预订
    const booking = await prisma.booking.create({
      data: {
        taskId,
        agentId: task.agentId,
        humanId,
        scheduledTime: new Date(scheduledTime),
        estimatedDuration,
        paymentAmount,
        currency: task.currency,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        task: true,
        agent: true,
        human: true,
      },
    })

    // 更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: {
        humanId,
        status: 'ASSIGNED',
      },
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
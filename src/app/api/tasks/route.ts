import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/tasks - 获取任务列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const humanId = searchParams.get('humanId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (agentId) {
      where.agentId = agentId
    }

    if (humanId) {
      where.humanId = humanId
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          human: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks - 创建新任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agentId,
      title,
      description,
      skills,
      location,
      scheduledTime,
      estimatedDuration,
      paymentAmount,
      currency = 'CNY',
      priority = 5,
    } = body

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: agentId },
    })

    if (!user || user.role !== 'AGENT') {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found or not an agent',
        },
        { status: 404 }
      )
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        agentId,
        title,
        description,
        skills,
        location,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        estimatedDuration,
        paymentAmount,
        currency,
        priority,
        status: 'OPEN',
      },
      include: {
        agent: true,
      },
    })

    // 查找匹配的人类专家
    const { findAvailableHumans, sortByMatchScore } = await import('@/lib/matching')
    const matchingHumans = await findAvailableHumans({
      skills,
      location,
      maxDistance: 10000,
    })

    const sortedHumans = sortByMatchScore(matchingHumans, task)

    // 通知匹配的专家（实际实现需要集成通知系统）
    console.log(`Task ${task.id} created, notifying ${sortedHumans.length} humans`)

    return NextResponse.json(
      {
        success: true,
        data: {
          task,
          matchedHumans: sortedHumans.slice(0, 10), // 返回前10个匹配
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task',
      },
      { status: 500 }
    )
  }
}
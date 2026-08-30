import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/mcp/search_humans - MCP: 搜索人类专家
 */
export async function POST_search_humans(request: NextRequest) {
  try {
    const body = await request.json()
    const { skills, location, rate_min, rate_max, rating_min, available_now } = body

    const { findAvailableHumans } = await import('@/lib/matching')

    const humans = await findAvailableHumans({
      skills,
      location,
      maxDistance: 10000,
      rateMin: rate_min,
      rateMax: rate_max,
      ratingMin: rating_min,
      availableNow: available_now ?? true,
    })

    return NextResponse.json({
      success: true,
      data: humans.map((human: any) => ({
        id: human.id,
        name: human.user.name,
        avatar: human.user.avatar,
        rating: human.user.rating,
        totalReviews: human.user.totalReviews,
        skills: human.skills,
        hourlyRate: human.hourlyRate,
        currency: human.currency,
        available: human.available,
        location: human.location,
      })),
      count: humans.length,
    })
  } catch (error) {
    console.error('MCP search_humans error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search humans',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mcp/get_human - MCP: 获取人类专家详情
 */
export async function POST_get_human(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const human = await prisma.humanProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            totalReviews: true,
            email: true,
          },
        },
        certifications: true,
      },
    })

    if (!human) {
      return NextResponse.json(
        {
          success: false,
          error: 'Human not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: human.id,
        name: human.user.name,
        avatar: human.user.avatar,
        rating: human.user.rating,
        totalReviews: human.user.totalReviews,
        bio: human.bio,
        skills: human.skills,
        hourlyRate: human.hourlyRate,
        currency: human.currency,
        available: human.available,
        verified: human.verified,
        totalTasks: human.totalTasks,
        successRate: human.successRate,
        location: human.location,
        certifications: human.certifications,
        email: human.user.email,
      },
    })
  } catch (error) {
    console.error('MCP get_human error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get human',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mcp/book_human - MCP: 预订人类专家
 */
export async function POST_book_human(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      human_id,
      task_description,
      task_location,
      scheduled_time,
      estimated_duration,
      payment_method,
      agent_id,
      payment_amount,
    } = body

    // 验证 Agent 存在
    const agent = await prisma.user.findUnique({
      where: { id: agent_id },
    })

    if (!agent || agent.role !== 'AGENT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid agent',
        },
        { status: 404 }
      )
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        agentId: agent_id,
        title: task_description.substring(0, 100),
        description: task_description,
        skills: [],
        location: task_location,
        scheduledTime: scheduled_time ? new Date(scheduled_time) : new Date(),
        estimatedDuration: estimated_duration,
        paymentAmount: payment_amount,
        currency: 'CNY',
        status: 'OPEN',
      },
    })

    // 创建预订
    const booking = await prisma.booking.create({
      data: {
        taskId: task.id,
        agentId: agent_id,
        humanId: human_id,
        scheduledTime: scheduled_time ? new Date(scheduled_time) : new Date(),
        estimatedDuration: estimated_duration,
        paymentAmount: payment_amount,
        currency: 'CNY',
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        task: true,
        agent: true,
        human: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          booking_id: booking.id,
          task_id: task.id,
          human_id: human_id,
          agent_id: agent_id,
          scheduled_time: booking.scheduledTime,
          estimated_duration: booking.estimatedDuration,
          payment_amount: booking.paymentAmount,
          currency: booking.currency,
          status: booking.status,
          human_name: booking.human.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('MCP book_human error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to book human',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mcp/get_booking - MCP: 获取预订状态
 */
export async function POST_get_booking(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        task: true,
        agent: {
          select: {
            name: true,
          },
        },
        human: {
          select: {
            name: true,
          },
        },
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
      data: {
        id: booking.id,
        task_id: booking.taskId,
        agent_id: booking.agentId,
        human_id: booking.humanId,
        scheduled_time: booking.scheduledTime,
        estimated_duration: booking.estimatedDuration,
        actual_duration: booking.actualDuration,
        payment_amount: booking.paymentAmount,
        currency: booking.currency,
        status: booking.status,
        payment_status: booking.paymentStatus,
        agent_name: booking.agent.name,
        human_name: booking.human.name,
        completion_proof: booking.completionProof,
        started_at: booking.startedAt,
        completed_at: booking.completedAt,
        created_at: booking.createdAt,
      },
    })
  } catch (error) {
    console.error('MCP get_booking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get booking',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mcp/update_booking - MCP: 更新预订状态
 */
export async function POST_update_booking(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, proof } = body

    const updateData: any = {
      status,
    }

    if (proof) {
      updateData.completionProof = proof
    }

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date()
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
      updateData.paymentStatus = 'PAID'

      // 更新任务状态
      await prisma.task.update({
        where: { id: body.task_id || undefined },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        task: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        status: booking.status,
        updated_at: booking.updatedAt,
      },
    })
  } catch (error) {
    console.error('MCP update_booking error:', error)
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
 * POST /api/mcp/list_skills - MCP: 列出所有可用技能
 */
export async function POST_list_skills(request: NextRequest) {
  try {
    const skillCategories = await prisma.skillCategory.findMany({
      include: {
        skills: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    const allSkills = skillCategories.flatMap((category) =>
      category.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        name_en: skill.nameEn,
        name_zh: skill.nameZh,
        category: category.name,
        category_en: category.nameEn,
        category_zh: category.nameZh,
        description: skill.description,
      }))
    )

    return NextResponse.json({
      success: true,
      data: {
        categories: skillCategories,
        skills: allSkills,
        total: allSkills.length,
      },
    })
  } catch (error) {
    console.error('MCP list_skills error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list skills',
      },
      { status: 500 }
    )
  }
}

// MCP Server 主路由
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tool } = body

    switch (tool) {
      case 'search_humans':
        return POST_search_humans(request)
      case 'get_human':
        return POST_get_human(request)
      case 'book_human':
        return POST_book_human(request)
      case 'get_booking':
        return POST_get_booking(request)
      case 'update_booking':
        return POST_update_booking(request)
      case 'list_skills':
        return POST_list_skills(request)
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown tool: ${tool}`,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('MCP server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// GET /api/mcp - MCP Server 信息
export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'HumanAPI MCP Server',
    version: '1.0.0',
    description: 'MCP server for AI agents to book human experts for physical-world tasks',
    tools: [
      'search_humans',
      'get_human',
      'book_human',
      'get_booking',
      'update_booking',
      'list_skills',
    ],
    baseUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/mcp`,
  })
}

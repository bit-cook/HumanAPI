import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * GET /api/humans/:id - 获取人类专家详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params

    const human = await prisma.humanProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            rating: true,
            totalReviews: true,
            verified: true,
          },
        },
        wallets: true,
        certifications: true,
        tasks: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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

    // 获取评价
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: human.userId,
      },
      include: {
        reviewer: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...human,
        reviews,
      },
    })
  } catch (error) {
    console.error('Error fetching human:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch human',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/humans/:id - 更新人类专家档案
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params
    const body = await request.json()
    const {
      bio,
      location,
      skills,
      hourlyRate,
      currency,
      available,
    } = body

    const human = await prisma.humanProfile.update({
      where: { id },
      data: {
        bio,
        location,
        skills,
        hourlyRate,
        currency,
        available,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: human,
    })
  } catch (error) {
    console.error('Error updating human:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update human',
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseJsonBody, updateHumanSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/humans/:id - 获取人类专家详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized
  try {
    const { id } = await context.params

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
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, updateHumanSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }
    const { skills, ...fields } = parsed.data

    const human = await prisma.humanProfile.update({
      where: { id },
      data: {
        ...fields,
        ...(skills ? { skills: skills.map(({ name }) => ({ name, verified: false })) } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, rating: true } },
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

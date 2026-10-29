import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseSearchParams, reviewsQuerySchema } from '@/lib/validation'
import { routeError } from '@/lib/api-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/humans/:id/reviews - 分页读取某专家收到的评价
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, reviewsQuerySchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const profile = await prisma.humanProfile.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Human not found' },
        { status: 404 }
      )
    }

    const { page, limit } = parsed.data
    const where = { revieweeId: profile.userId }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return routeError(error, 'Error fetching reviews', 'Human not found')
  }
}

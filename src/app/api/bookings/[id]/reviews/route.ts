import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseJsonBody, createReviewSchema } from '@/lib/validation'
import { recalculateUserRating } from '@/lib/reviews'
import { HttpError, httpErrorResponse } from '@/lib/api-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/bookings/:id/reviews - 对已完成的预约提交评价
 * reviewer 必须是该预约的 agent 或 human，reviewee 自动取对方。
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, createReviewSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { reviewerId, rating, comment } = parsed.data

    const review = await prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.findUnique({
        where: { id },
        select: { status: true, agentId: true, humanId: true },
      })
      if (!booking) throw new HttpError('Booking not found', 404)
      if (booking.status !== 'COMPLETED') {
        throw new HttpError('Only completed bookings can be reviewed', 409)
      }
      if (reviewerId !== booking.agentId && reviewerId !== booking.humanId) {
        throw new HttpError(
          'Reviewer must be the agent or human of this booking',
          403
        )
      }

      const revieweeId =
        reviewerId === booking.agentId ? booking.humanId : booking.agentId

      const created = await transaction.review.create({
        data: {
          bookingId: id,
          reviewerId,
          revieweeId,
          rating,
          comment: comment ?? null,
        },
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
          reviewee: { select: { id: true, name: true, avatar: true } },
        },
      })

      // 同一事务内重估被评方聚合分，保证读取一致
      const aggregate = await transaction.review.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
        _count: { _all: true },
      })
      const totalReviews = aggregate._count._all
      const averaged =
        totalReviews === 0
          ? 5
          : Math.round((aggregate._avg.rating ?? 5) * 100) / 100
      await transaction.user.update({
        where: { id: revieweeId },
        data: { rating: averaged, totalReviews },
      })

      return created
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: 'Reviewer already reviewed this booking' },
        { status: 409 }
      )
    }
    return httpErrorResponse(error)
  }
}

/**
 * GET /api/bookings/:id/reviews - 读取预约下的评价
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(_request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const reviews = await prisma.review.findMany({
      where: { bookingId: id },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: reviews, count: reviews.length })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export { recalculateUserRating }

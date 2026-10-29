import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseSearchParams, disputesQuerySchema } from '@/lib/validation'
import { routeError } from '@/lib/api-error'

/**
 * GET /api/disputes - 争议列表（可按状态 / 预约 / 举报人过滤）
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, disputesQuerySchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { status, bookingId, reporterId, page, limit } = parsed.data
    const where = {
      ...(status ? { status } : {}),
      ...(bookingId ? { bookingId } : {}),
      ...(reporterId ? { reporterId } : {}),
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, avatar: true } },
          booking: {
            select: {
              id: true,
              status: true,
              agent: { select: { id: true, name: true } },
              human: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return routeError(error, 'Error fetching disputes', 'Dispute not found')
  }
}

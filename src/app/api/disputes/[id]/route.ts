import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseJsonBody, updateDisputeSchema } from '@/lib/validation'
import { routeError } from '@/lib/api-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/disputes/:id - 争议详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const dispute = await prisma.dispute.findUnique({
      where: { id },
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
    })

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: dispute })
  } catch (error) {
    return routeError(error, 'Error fetching dispute', 'Dispute not found')
  }
}

/**
 * PUT /api/disputes/:id - 更新争议状态与处理结论
 * 置 RESOLVED / REJECTED 时记录 resolvedAt。
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, updateDisputeSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { status, aiResolution, humanResolution } = parsed.data
    const closes = status === 'RESOLVED' || status === 'REJECTED'

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status,
        ...(aiResolution !== undefined ? { aiResolution } : {}),
        ...(humanResolution !== undefined ? { humanResolution } : {}),
        ...(closes ? { resolvedAt: new Date() } : {}),
      },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ success: true, data: dispute })
  } catch (error) {
    return routeError(error, 'Error updating dispute', 'Dispute not found')
  }
}

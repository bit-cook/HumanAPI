import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import {
  createMessageSchema,
  messagesQuerySchema,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/validation'
import { HttpError, httpErrorResponse, routeError } from '@/lib/api-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bookings/:id/messages - 分页读取预约消息（最新在前）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, messagesQuerySchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { page, limit } = parsed.data
    const where = { bookingId: id }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          recipient: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return routeError(error, 'Error fetching messages', 'Booking not found')
  }
}

/**
 * POST /api/bookings/:id/messages - 在预约上下文中发送消息
 * sender/recipient 必须是该预约的 agent 或 human。
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, createMessageSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { senderId, recipientId, content } = parsed.data

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { agentId: true, humanId: true },
    })
    if (!booking) throw new HttpError('Booking not found', 404)

    const participants = new Set([booking.agentId, booking.humanId])
    if (!participants.has(senderId) || !participants.has(recipientId)) {
      throw new HttpError(
        'Sender and recipient must be participants of this booking',
        403
      )
    }

    const message = await prisma.message.create({
      data: { bookingId: id, senderId, recipientId, content },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    return httpErrorResponse(error)
  }
}

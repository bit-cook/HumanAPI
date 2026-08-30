import { NextRequest, NextResponse } from 'next/server'

import { requireApiKey } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseJsonBody, updateBookingSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        task: true,
        agent: { select: { id: true, name: true, avatar: true } },
        human: { select: { id: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        },
        reviews: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, updateBookingSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const updated = await prisma.booking.updateMany({
      where: { id, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: parsed.data,
    })
    if (updated.count !== 1) {
      return NextResponse.json(
        { success: false, error: 'Only pending or confirmed bookings can be edited' },
        { status: 409 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        task: true,
        agent: { select: { id: true, name: true, avatar: true } },
        human: { select: { id: true, name: true, avatar: true } },
      },
    })
    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}

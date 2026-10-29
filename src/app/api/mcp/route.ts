import type { BookingStatus, Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import {
  bookingActionForStatus,
  getBookingTransition,
  getBookingTransitionDefinition,
  isValidBookingTransition,
} from '@/lib/booking-state'
import { APP_VERSION } from '@/lib/version'

const identifierSchema = z.string().trim().min(1).max(191)
const locationSchema = z
  .object({
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    city: z.string().trim().min(1).max(200).optional(),
    country: z.string().trim().min(1).max(200).optional(),
    address: z.string().trim().min(1).max(500).optional(),
  })
  .strict()

const searchHumansArgumentsSchema = z
  .object({
    skills: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    location: locationSchema.pick({ lat: true, lon: true }).optional(),
    max_distance: z.number().finite().positive().max(20_000_000).default(10_000),
    rate_min: z.number().finite().nonnegative().optional(),
    rate_max: z.number().finite().nonnegative().optional(),
    rating_min: z.number().finite().min(0).max(5).optional(),
    available_now: z.boolean().default(true),
  })
  .strict()
  .refine(
    ({ rate_min, rate_max }) =>
      rate_min === undefined || rate_max === undefined || rate_min <= rate_max,
    { message: 'rate_min must be less than or equal to rate_max', path: ['rate_min'] }
  )

const getHumanArgumentsSchema = z.object({ id: identifierSchema }).strict()
const bookHumanArgumentsSchema = z
  .object({
    human_id: identifierSchema,
    task_description: z.string().trim().min(1).max(10_000),
    task_location: locationSchema,
    scheduled_time: z.string().datetime({ offset: true }),
    estimated_duration: z.number().int().positive().max(10_080),
    payment_method: z.string().trim().min(1).max(100).optional(),
    agent_id: identifierSchema,
    payment_amount: z.number().finite().positive(),
  })
  .strict()

const getBookingArgumentsSchema = z.object({ id: identifierSchema }).strict()
const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
])
const updateBookingArgumentsSchema = z
  .object({
    id: identifierSchema,
    // PENDING 是初始态不可回退；DISPUTED 只能经 resolve 动作离开
    status: bookingStatusSchema.exclude(['PENDING', 'DISPUTED']),
    proof: z.string().trim().min(1).max(10_000).optional(),
  })
  .strict()
const listSkillsArgumentsSchema = z.object({}).strict()

const createReviewArgumentsSchema = z
  .object({
    booking_id: identifierSchema,
    reviewer_id: identifierSchema,
    rating: z.number().finite().min(1).max(5),
    comment: z.string().trim().max(2_000).optional(),
  })
  .strict()

const sendMessageArgumentsSchema = z
  .object({
    booking_id: identifierSchema,
    sender_id: identifierSchema,
    recipient_id: identifierSchema,
    content: z.string().trim().min(1).max(5_000),
  })
  .strict()
  .refine((value) => value.sender_id !== value.recipient_id, {
    message: 'sender_id and recipient_id must be different',
    path: ['recipient_id'],
  })

const createDisputeArgumentsSchema = z
  .object({
    booking_id: identifierSchema,
    reporter_id: identifierSchema,
    reason: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5_000),
    evidence: z
      .array(z.record(z.string(), z.unknown()))
      .max(20)
      .optional(),
  })
  .strict()

const getDisputeArgumentsSchema = z.object({ id: identifierSchema }).strict()

const listDisputesArgumentsSchema = z
  .object({
    status: z
      .enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED'])
      .optional(),
    booking_id: identifierSchema.optional(),
  })
  .strict()

const resolveDisputeArgumentsSchema = z
  .object({
    id: identifierSchema,
    status: z.enum(['RESOLVED', 'REJECTED']),
    resolution: z.string().trim().max(5_000).optional(),
  })
  .strict()

const toolNameSchema = z.enum([
  'search_humans',
  'get_human',
  'book_human',
  'get_booking',
  'update_booking',
  'list_skills',
  'create_review',
  'send_message',
  'create_dispute',
  'get_dispute',
  'list_disputes',
  'resolve_dispute',
])
const requestEnvelopeSchema = z
  .object({
    tool: toolNameSchema,
    arguments: z.unknown().default({}),
  })
  .strict()

type McpToolCall =
  | { tool: 'search_humans'; arguments: z.infer<typeof searchHumansArgumentsSchema> }
  | { tool: 'get_human'; arguments: z.infer<typeof getHumanArgumentsSchema> }
  | { tool: 'book_human'; arguments: z.infer<typeof bookHumanArgumentsSchema> }
  | { tool: 'get_booking'; arguments: z.infer<typeof getBookingArgumentsSchema> }
  | { tool: 'update_booking'; arguments: z.infer<typeof updateBookingArgumentsSchema> }
  | { tool: 'list_skills'; arguments: z.infer<typeof listSkillsArgumentsSchema> }
  | { tool: 'create_review'; arguments: z.infer<typeof createReviewArgumentsSchema> }
  | { tool: 'send_message'; arguments: z.infer<typeof sendMessageArgumentsSchema> }
  | { tool: 'create_dispute'; arguments: z.infer<typeof createDisputeArgumentsSchema> }
  | { tool: 'get_dispute'; arguments: z.infer<typeof getDisputeArgumentsSchema> }
  | { tool: 'list_disputes'; arguments: z.infer<typeof listDisputesArgumentsSchema> }
  | {
      tool: 'resolve_dispute'
      arguments: z.infer<typeof resolveDisputeArgumentsSchema>
    }

class McpHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'McpHttpError'
  }
}

function parseMcpToolCall(value: unknown): McpToolCall {
  const envelope = requestEnvelopeSchema.parse(value)

  switch (envelope.tool) {
    case 'search_humans':
      return {
        tool: envelope.tool,
        arguments: searchHumansArgumentsSchema.parse(envelope.arguments),
      }
    case 'get_human':
      return {
        tool: envelope.tool,
        arguments: getHumanArgumentsSchema.parse(envelope.arguments),
      }
    case 'book_human':
      return {
        tool: envelope.tool,
        arguments: bookHumanArgumentsSchema.parse(envelope.arguments),
      }
    case 'get_booking':
      return {
        tool: envelope.tool,
        arguments: getBookingArgumentsSchema.parse(envelope.arguments),
      }
    case 'update_booking':
      return {
        tool: envelope.tool,
        arguments: updateBookingArgumentsSchema.parse(envelope.arguments),
      }
    case 'list_skills':
      return {
        tool: envelope.tool,
        arguments: listSkillsArgumentsSchema.parse(envelope.arguments),
      }
    case 'create_review':
      return {
        tool: envelope.tool,
        arguments: createReviewArgumentsSchema.parse(envelope.arguments),
      }
    case 'send_message':
      return {
        tool: envelope.tool,
        arguments: sendMessageArgumentsSchema.parse(envelope.arguments),
      }
    case 'create_dispute':
      return {
        tool: envelope.tool,
        arguments: createDisputeArgumentsSchema.parse(envelope.arguments),
      }
    case 'get_dispute':
      return {
        tool: envelope.tool,
        arguments: getDisputeArgumentsSchema.parse(envelope.arguments),
      }
    case 'list_disputes':
      return {
        tool: envelope.tool,
        arguments: listDisputesArgumentsSchema.parse(envelope.arguments),
      }
    case 'resolve_dispute':
      return {
        tool: envelope.tool,
        arguments: resolveDisputeArgumentsSchema.parse(envelope.arguments),
      }
  }
}

function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: 'Invalid MCP request',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  )
}

function errorResponse(error: unknown) {
  if (error instanceof McpHttpError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    )
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  ) {
    return NextResponse.json(
      { success: false, error: 'Resource already exists' },
      { status: 409 }
    )
  }

  console.error('MCP server error:', error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

async function searchHumans(args: z.infer<typeof searchHumansArgumentsSchema>) {
  const { findAvailableHumans } = await import('@/lib/matching')
  const humans = await findAvailableHumans({
    skills: args.skills,
    location: args.location,
    maxDistance: args.max_distance,
    rateMin: args.rate_min,
    rateMax: args.rate_max,
    ratingMin: args.rating_min,
    availableNow: args.available_now,
  })

  return NextResponse.json({
    success: true,
    data: humans.map((human) => ({
      id: human.id,
      userId: human.user.id,
      name: human.user.name,
      avatar: human.user.avatar,
      rating: human.user.rating,
      totalReviews: human.user.totalReviews,
      skills: human.skills,
      hourlyRate: human.hourlyRate,
      currency: human.currency,
      available: human.available,
      verified: human.verified,
      location: human.location,
      ...(human.locationMatch !== undefined
        ? { locationMatch: human.locationMatch, distance: human.distance }
        : {}),
    })),
    count: humans.length,
  })
}

async function getHuman(args: z.infer<typeof getHumanArgumentsSchema>) {
  const human = await prisma.humanProfile.findUnique({
    where: { id: args.id },
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

  if (!human) throw new McpHttpError('Human not found', 404)

  return NextResponse.json({
    success: true,
    data: {
      id: human.id,
      userId: human.user.id,
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
}

async function bookHuman(args: z.infer<typeof bookHumanArgumentsSchema>) {
  const scheduledTime = new Date(args.scheduled_time)

  const booking = await prisma.$transaction(async (transaction) => {
    const [agent, human] = await Promise.all([
      transaction.user.findUnique({
        where: { id: args.agent_id },
        select: { id: true, role: true },
      }),
      transaction.humanProfile.findUnique({
        where: { id: args.human_id },
        select: {
          userId: true,
          available: true,
          verified: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ])

    if (!agent || agent.role !== 'AGENT') {
      throw new McpHttpError('Invalid agent', 404)
    }
    if (!human) throw new McpHttpError('Human not found', 404)
    if (!human.available || !human.verified) {
      throw new McpHttpError('Human is not verified and available', 409)
    }

    const task = await transaction.task.create({
      data: {
        agentId: agent.id,
        humanId: human.userId,
        title: args.task_description.slice(0, 100),
        description: args.task_description,
        skills: [],
        location: args.task_location,
        scheduledTime,
        estimatedDuration: args.estimated_duration,
        paymentAmount: args.payment_amount,
        currency: 'CNY',
        status: 'ASSIGNED',
      },
    })

    const createdBooking = await transaction.booking.create({
      data: {
        taskId: task.id,
        agentId: agent.id,
        humanId: human.userId,
        scheduledTime,
        estimatedDuration: args.estimated_duration,
        paymentAmount: args.payment_amount,
        currency: 'CNY',
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    })

    return { ...createdBooking, humanName: human.user.name }
  })

  return NextResponse.json(
    {
      success: true,
      data: {
        booking_id: booking.id,
        task_id: booking.taskId,
        human_id: args.human_id,
        agent_id: booking.agentId,
        scheduled_time: booking.scheduledTime,
        estimated_duration: booking.estimatedDuration,
        payment_amount: booking.paymentAmount,
        currency: booking.currency,
        status: booking.status,
        human_name: booking.humanName,
      },
    },
    { status: 201 }
  )
}

async function getBooking(args: z.infer<typeof getBookingArgumentsSchema>) {
  const booking = await prisma.booking.findUnique({
    where: { id: args.id },
    include: {
      agent: { select: { name: true } },
      human: {
        select: {
          name: true,
          humanProfile: { select: { id: true } },
        },
      },
    },
  })

  if (!booking) throw new McpHttpError('Booking not found', 404)

  return NextResponse.json({
    success: true,
    data: {
      id: booking.id,
      task_id: booking.taskId,
      agent_id: booking.agentId,
      human_id: booking.human.humanProfile?.id ?? booking.humanId,
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
}

function taskUpdateForStatus(
  status: BookingStatus,
  now: Date
): Prisma.TaskUncheckedUpdateInput | undefined {
  const action = bookingActionForStatus(
    status as Exclude<BookingStatus, 'PENDING' | 'DISPUTED'>
  )
  const transition = getBookingTransitionDefinition(action)
  if (!transition.task) return undefined

  return {
    status: transition.task,
    ...(transition.countsCompletion ? { completedAt: now } : {}),
  }
}

async function updateBooking(args: z.infer<typeof updateBookingArgumentsSchema>) {
  const booking = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.booking.findUnique({
      where: { id: args.id },
      select: { status: true, taskId: true },
    })
    if (!existing) throw new McpHttpError('Booking not found', 404)
    if (!isValidBookingTransition(existing.status, args.status)) {
      throw new McpHttpError(
        `Cannot transition booking from ${existing.status} to ${args.status}`,
        409
      )
    }

    const now = new Date()
    const bookingUpdate: Prisma.BookingUncheckedUpdateInput = {
      status: args.status,
      ...(args.proof ? { completionProof: args.proof } : {}),
      ...(args.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS'
        ? { startedAt: now }
        : {}),
      ...(args.status === 'COMPLETED' ? { completedAt: now } : {}),
    }
    const taskUpdate = taskUpdateForStatus(args.status, now)

    const changed = await transaction.booking.updateMany({
      where: { id: args.id, status: existing.status },
      data: bookingUpdate,
    })
    if (changed.count !== 1) {
      throw new McpHttpError('Booking changed concurrently; retry the request', 409)
    }
    if (taskUpdate) {
      await transaction.task.update({
        where: { id: existing.taskId },
        data: taskUpdate,
      })
    }

    return transaction.booking.findUniqueOrThrow({ where: { id: args.id } })
  })

  return NextResponse.json({
    success: true,
    data: {
      id: booking.id,
      status: booking.status,
      updated_at: booking.updatedAt,
    },
  })
}

async function listSkills() {
  const skillCategories = await prisma.skillCategory.findMany({
    include: { skills: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
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
}

async function loadBookingParticipants(
  transaction: {
    booking: {
      findUnique: typeof prisma.booking.findUnique
    }
  },
  bookingId: string
) {
  const booking = await transaction.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, agentId: true, humanId: true },
  })
  if (!booking) throw new McpHttpError('Booking not found', 404)
  return booking
}

async function createReview(args: z.infer<typeof createReviewArgumentsSchema>) {
  const review = await prisma.$transaction(async (transaction) => {
    const booking = await loadBookingParticipants(transaction, args.booking_id)
    if (booking.status !== 'COMPLETED') {
      throw new McpHttpError('Only completed bookings can be reviewed', 409)
    }
    if (
      args.reviewer_id !== booking.agentId &&
      args.reviewer_id !== booking.humanId
    ) {
      throw new McpHttpError(
        'Reviewer must be the agent or human of this booking',
        403
      )
    }

    const revieweeId =
      args.reviewer_id === booking.agentId ? booking.humanId : booking.agentId

    const created = await transaction.review.create({
      data: {
        bookingId: args.booking_id,
        reviewerId: args.reviewer_id,
        revieweeId,
        rating: args.rating,
        comment: args.comment ?? null,
      },
    })

    const aggregate = await transaction.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { _all: true },
    })
    await transaction.user.update({
      where: { id: revieweeId },
      data: {
        rating:
          aggregate._count._all === 0
            ? 5
            : Math.round((aggregate._avg.rating ?? 5) * 100) / 100,
        totalReviews: aggregate._count._all,
      },
    })

    return created
  })

  return NextResponse.json({ success: true, data: review }, { status: 201 })
}

async function sendMessage(args: z.infer<typeof sendMessageArgumentsSchema>) {
  const booking = await prisma.$transaction(async (transaction) => {
    const current = await loadBookingParticipants(transaction, args.booking_id)
    const participants = new Set([current.agentId, current.humanId])
    if (
      !participants.has(args.sender_id) ||
      !participants.has(args.recipient_id)
    ) {
      throw new McpHttpError(
        'Sender and recipient must be participants of this booking',
        403
      )
    }

    return transaction.message.create({
      data: {
        bookingId: args.booking_id,
        senderId: args.sender_id,
        recipientId: args.recipient_id,
        content: args.content,
      },
    })
  })

  return NextResponse.json({ success: true, data: booking }, { status: 201 })
}

async function createDispute(args: z.infer<typeof createDisputeArgumentsSchema>) {
  const dispute = await prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.findUnique({
      where: { id: args.booking_id },
      select: { status: true, agentId: true, humanId: true },
    })
    if (!booking) throw new McpHttpError('Booking not found', 404)
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new McpHttpError('Booking is already closed', 409)
    }
    if (
      args.reporter_id !== booking.agentId &&
      args.reporter_id !== booking.humanId
    ) {
      throw new McpHttpError(
        'Reporter must be the agent or human of this booking',
        403
      )
    }
    if (!getBookingTransition('dispute', booking.status)) {
      throw new McpHttpError('Booking cannot be disputed', 409)
    }

    const existing = await transaction.dispute.findFirst({
      where: { bookingId: args.booking_id, status: 'OPEN' },
      select: { id: true },
    })
    if (existing) {
      throw new McpHttpError('An open dispute already exists', 409)
    }

    const created = await transaction.dispute.create({
      data: {
        bookingId: args.booking_id,
        reporterId: args.reporter_id,
        reason: args.reason,
        description: args.description,
        ...(args.evidence
          ? {
              evidence: args.evidence as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    })

    await transaction.booking.updateMany({
      where: { id: args.booking_id, status: booking.status },
      data: { status: 'DISPUTED' },
    })

    return created
  })

  return NextResponse.json({ success: true, data: dispute }, { status: 201 })
}

async function getDispute(args: z.infer<typeof getDisputeArgumentsSchema>) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: args.id },
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      booking: { select: { id: true, status: true } },
    },
  })
  if (!dispute) throw new McpHttpError('Dispute not found', 404)
  return NextResponse.json({ success: true, data: dispute })
}

async function listDisputes(args: z.infer<typeof listDisputesArgumentsSchema>) {
  const where = {
    ...(args.status ? { status: args.status } : {}),
    ...(args.booking_id ? { bookingId: args.booking_id } : {}),
  }
  const disputes = await prisma.dispute.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({
    success: true,
    data: disputes,
    count: disputes.length,
  })
}

async function resolveDispute(args: z.infer<typeof resolveDisputeArgumentsSchema>) {
  const dispute = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.dispute.findUnique({
      where: { id: args.id },
      select: { status: true },
    })
    if (!existing) throw new McpHttpError('Dispute not found', 404)
    if (existing.status === 'RESOLVED' || existing.status === 'REJECTED') {
      throw new McpHttpError('Dispute is already closed', 409)
    }

    return transaction.dispute.update({
      where: { id: args.id },
      data: {
        status: args.status,
        ...(args.resolution !== undefined
          ? { humanResolution: args.resolution }
          : {}),
        resolvedAt: new Date(),
      },
    })
  })

  return NextResponse.json({ success: true, data: dispute })
}

async function dispatchToolCall(call: McpToolCall) {
  switch (call.tool) {
    case 'search_humans':
      return searchHumans(call.arguments)
    case 'get_human':
      return getHuman(call.arguments)
    case 'book_human':
      return bookHuman(call.arguments)
    case 'get_booking':
      return getBooking(call.arguments)
    case 'update_booking':
      return updateBooking(call.arguments)
    case 'list_skills':
      return listSkills()
    case 'create_review':
      return createReview(call.arguments)
    case 'send_message':
      return sendMessage(call.arguments)
    case 'create_dispute':
      return createDispute(call.arguments)
    case 'get_dispute':
      return getDispute(call.arguments)
    case 'list_disputes':
      return listDisputes(call.arguments)
    case 'resolve_dispute':
      return resolveDispute(call.arguments)
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  try {
    return await dispatchToolCall(parseMcpToolCall(body))
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  return NextResponse.json({
    name: 'HumanAPI MCP Server',
    version: APP_VERSION,
    description:
      'MCP server for AI agents to book human experts for physical-world tasks',
    tools: toolNameSchema.options,
    baseUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/mcp`,
  })
}

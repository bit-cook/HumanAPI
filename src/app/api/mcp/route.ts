import { createHash, timingSafeEqual } from 'node:crypto'

import type { BookingStatus, Prisma, TaskStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'

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
    status: bookingStatusSchema.exclude(['PENDING']),
    proof: z.string().trim().min(1).max(10_000).optional(),
  })
  .strict()
const listSkillsArgumentsSchema = z.object({}).strict()

const toolNameSchema = z.enum([
  'search_humans',
  'get_human',
  'book_human',
  'get_booking',
  'update_booking',
  'list_skills',
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
  }
}

function isMcpRequestAuthorized(
  headers: Headers,
  configuredApiKey = process.env.MCP_API_KEY
): boolean {
  if (!configuredApiKey) return true

  const authorization = headers.get('authorization')
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i)
  const expectedDigest = createHash('sha256').update(configuredApiKey).digest()
  const candidates = [bearerMatch?.[1], headers.get('x-api-key')]

  return candidates.some((candidate) => {
    if (!candidate) return false
    const candidateDigest = createHash('sha256').update(candidate.trim()).digest()
    return timingSafeEqual(expectedDigest, candidateDigest)
  })
}

const bookingTransitions: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: [],
}

function isValidBookingTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
): boolean {
  return bookingTransitions[currentStatus].includes(nextStatus)
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
    maxDistance: args.max_distance ?? 10_000,
    rateMin: args.rate_min,
    rateMax: args.rate_max,
    ratingMin: args.rating_min,
    availableNow: args.available_now ?? true,
  })

  return NextResponse.json({
    success: true,
    data: humans.map((human) => ({
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
          available: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ])

    if (!agent || agent.role !== 'AGENT') {
      throw new McpHttpError('Invalid agent', 404)
    }
    if (!human) throw new McpHttpError('Human not found', 404)
    if (!human.available) throw new McpHttpError('Human is not available', 409)

    const task = await transaction.task.create({
      data: {
        agentId: agent.id,
        humanId: human.user.id,
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
        humanId: human.user.id,
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
  const taskStatus: Partial<Record<BookingStatus, TaskStatus>> = {
    CONFIRMED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }
  const nextTaskStatus = taskStatus[status]
  if (!nextTaskStatus) return undefined

  return {
    status: nextTaskStatus,
    ...(status === 'COMPLETED' ? { completedAt: now } : {}),
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
      ...(args.status === 'COMPLETED'
        ? { completedAt: now, paymentStatus: 'PAID' }
        : {}),
    }
    const taskUpdate = taskUpdateForStatus(args.status, now)

    const updatedBooking = await transaction.booking.update({
      where: { id: args.id },
      data: bookingUpdate,
    })
    if (taskUpdate) {
      await transaction.task.update({
        where: { id: existing.taskId },
        data: taskUpdate,
      })
    }

    return updatedBooking
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
  }
}

export async function POST(request: NextRequest) {
  if (!isMcpRequestAuthorized(request.headers)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

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
  if (!isMcpRequestAuthorized(request.headers)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  return NextResponse.json({
    name: 'HumanAPI MCP Server',
    version: '1.0.0',
    description: 'MCP server for AI agents to book human experts for physical-world tasks',
    tools: toolNameSchema.options,
    baseUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/mcp`,
  })
}

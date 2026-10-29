import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  createHumanSchema,
  humansQuerySchema,
  parseJsonBody,
  parseSearchParams,
} from '@/lib/validation'
import { findAvailableHumans, hasAllSkills } from '@/lib/matching'
import { requireApiKey } from '@/lib/auth'

function serializeHuman(
  human: Awaited<ReturnType<typeof findAvailableHumans>>[number]
) {
  return {
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
    ...(human.locationMatch !== undefined
      ? { locationMatch: human.locationMatch, distance: human.distance }
      : {}),
  }
}

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

/**
 * GET /api/humans - 获取人类专家列表（分页）
 * 不带位置参数时走数据库分页；带位置参数时逐条计算距离后在内存分页。
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, humansQuerySchema)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const {
      skills,
      lat,
      lon,
      maxDistance,
      rateMin,
      rateMax,
      ratingMin,
      availableNow,
      page,
      limit,
    } = parsed.data

    const hasLocation = lat !== undefined && lon !== undefined

    if (hasLocation) {
      const matched = await findAvailableHumans({
        skills,
        location: { lat: lat as number, lon: lon as number },
        maxDistance,
        rateMin,
        rateMax,
        ratingMin,
        availableNow,
      })
      const start = (page - 1) * limit

      return NextResponse.json({
        success: true,
        data: matched.slice(start, start + limit).map(serializeHuman),
        pagination: pagination(page, limit, matched.length),
      })
    }

    const where = {
      verified: true,
      ...(availableNow ? { available: true } : {}),
      hourlyRate: { gte: rateMin, lte: rateMax },
      ...(ratingMin > 0 ? { user: { rating: { gte: ratingMin } } } : {}),
    }

    const [rows, total] = await Promise.all([
      prisma.humanProfile.findMany({
        where,
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
          wallets: true,
          certifications: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.humanProfile.count({ where }),
    ])

    const filtered = rows.filter((human) =>
      hasAllSkills(human.skills, skills ?? [])
    )

    return NextResponse.json({
      success: true,
      data: filtered.map(serializeHuman),
      pagination: pagination(page, limit, total),
    })
  } catch (error) {
    console.error('Error fetching humans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch humans' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/humans - 注册为人类专家
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const parsed = await parseJsonBody(request, createHumanSchema)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { userId, bio, location, skills, hourlyRate, currency } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const existingProfile = await prisma.humanProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Human profile already exists' },
        { status: 409 }
      )
    }

    const profile = await prisma.humanProfile.create({
      data: {
        userId,
        bio,
        location,
        // 自报技能一律未验证，由平台侧后续核验
        skills: skills.map((skill) => ({ name: skill.name, verified: false })),
        hourlyRate,
        currency,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    })

    return NextResponse.json({ success: true, data: profile }, { status: 201 })
  } catch (error) {
    console.error('Error creating human profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create human profile' },
      { status: 500 }
    )
  }
}

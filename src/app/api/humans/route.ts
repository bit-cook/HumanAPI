import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  createHumanSchema,
  humansQuerySchema,
  parseJsonBody,
  parseSearchParams,
  parseSkillJson,
} from '@/lib/validation'
import type { Prisma } from '@prisma/client'
import { requireApiKey } from '@/lib/auth'

/**
 * GET /api/humans - 获取人类专家列表
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
    } = parsed.data

    const where: Prisma.HumanProfileWhereInput = {
      verified: true,
      ...(availableNow ? { available: true } : {}),
      hourlyRate: {
        gte: rateMin,
        lte: rateMax,
      },
    }

    if (ratingMin > 0) {
      where.user = {
        rating: {
          gte: ratingMin,
        },
      }
    }

    let humans = await prisma.humanProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            totalReviews: true,
          },
        },
        certifications: true,
      },
      orderBy: {
        user: {
          rating: 'desc',
        },
      },
    })

    // 技能筛选
    if (skills && skills.length > 0) {
      humans = humans.filter((human) => {
        const humanSkills = parseSkillJson(human.skills).map((skill) => skill.name)
        return skills.every((skill) => humanSkills.includes(skill))
      })
    }

    // 位置筛选
    if (lat !== undefined && lon !== undefined) {
      const { findAvailableHumans } = await import('@/lib/matching')
      const locationHumans = await findAvailableHumans({
        skills,
        location: { lat, lon },
        maxDistance,
        rateMin,
        rateMax,
        ratingMin,
        availableNow,
      })
      return NextResponse.json({
        success: true,
        data: locationHumans,
        count: locationHumans.length,
      })
    }

    return NextResponse.json({
      success: true,
      data: humans,
      count: humans.length,
    })
  } catch (error) {
    console.error('Error fetching humans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch humans',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/humans - 注册为人类专家
 */
export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized
    const parsed = await parseJsonBody(request, createHumanSchema)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const {
      userId,
      bio,
      location,
      skills,
      hourlyRate,
      currency,
    } = parsed.data

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // 检查是否已经是人类专家
    const existingProfile = await prisma.humanProfile.findUnique({
      where: { userId },
    })

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Human profile already exists',
        },
        { status: 400 }
      )
    }

    // 创建人类专家档案
    const profile = await prisma.humanProfile.create({
      data: {
        userId,
        bio,
        location,
        skills: skills.map((skill) => ({ ...skill, verified: false })),
        hourlyRate,
        currency,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, rating: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating human profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create human profile',
      },
      { status: 500 }
    )
  }
}

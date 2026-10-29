import { prisma } from '@/lib/db'
import { calculateDistance, calculateLocationMatch } from '@/lib/location'
import type { Prisma } from '@prisma/client'

export interface Skill {
  name: string
  verified: boolean
}

export interface MatchScore {
  skillMatch: number
  locationMatch: number
  ratingMatch: number
  availabilityMatch: number
  priceMatch: number
  totalScore: number
}

export interface Coordinates {
  lat: number
  lon: number
}

export interface GeoPoint extends Coordinates {
  locationMatch: number
  distance: number
}

export type HumanProfileRecord = Prisma.HumanProfileGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        avatar: true
        rating: true
        totalReviews: true
        email: true
      }
    }
    wallets: true
    certifications: true
  }
}>

/** 匹配结果：不提供位置时 locationMatch/distance 为 undefined */
export type MatchedHuman = HumanProfileRecord & Partial<GeoPoint>

interface MatchableHuman {
  skills: Prisma.JsonValue
  locationMatch?: number
  user: { rating: number }
  available: boolean
  hourlyRate: number
}

export function parseSkills(value: Prisma.JsonValue): Skill[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((skill) => {
    if (
      typeof skill === 'object' &&
      skill !== null &&
      !Array.isArray(skill) &&
      typeof skill.name === 'string' &&
      typeof skill.verified === 'boolean'
    ) {
      return [{ name: skill.name, verified: skill.verified }]
    }
    return []
  })
}

/**
 * Prisma JSON 字段在运行期不可信：脏数据返回 null，由调用方决定
 * 是剔除该专家还是按无地理位置处理，而不是把 NaN 扩散进匹配分。
 */
export function parseCoordinates(value: unknown): Coordinates | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const { lat, lon } = value as Record<string, unknown>
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null
  }
  return { lat, lon }
}

/** 技能过滤的唯一实现：REST 与 MCP 共用，要求技能全部 verified */
export function hasAllSkills(
  skills: Prisma.JsonValue,
  required: readonly string[]
): boolean {
  if (required.length === 0) return true
  const humanSkills = parseSkills(skills)
  return required.every((skill) =>
    humanSkills.some((hs) => hs.name === skill && hs.verified)
  )
}

/**
 * 查找可用的人类专家。位置参数可选；提供时返回结果附带
 * locationMatch（0-100）与 distance（米），不提供时两个字段为 undefined。
 */
export async function findAvailableHumans(params: {
  skills?: string[]
  location?: Coordinates
  maxDistance?: number
  rateMin?: number
  rateMax?: number
  ratingMin?: number
  availableNow?: boolean
}): Promise<MatchedHuman[]> {
  const {
    skills,
    location,
    maxDistance = 10_000,
    rateMin,
    rateMax,
    ratingMin,
    availableNow = true,
  } = params

  const where: Prisma.HumanProfileWhereInput = {
    verified: true,
    ...(availableNow ? { available: true } : {}),
    hourlyRate: {
      ...(rateMin !== undefined ? { gte: rateMin } : {}),
      ...(rateMax !== undefined ? { lte: rateMax } : {}),
    },
    ...(ratingMin !== undefined && ratingMin > 0
      ? { user: { rating: { gte: ratingMin } } }
      : {}),
  }

  const humans = await prisma.humanProfile.findMany({
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
  })

  let result = humans.filter((human) => hasAllSkills(human.skills, skills ?? []))

  if (location) {
    result = result.flatMap((human) => {
      const coordinates = parseCoordinates(human.location)
      if (!coordinates) return []
      const locationMatch = calculateLocationMatch(
        location,
        coordinates,
        maxDistance
      )
      if (locationMatch <= 0) return []
      return [
        {
          ...human,
          locationMatch,
          distance: calculateDistance(location, coordinates),
        },
      ]
    })
  }

  return result
}

/**
 * 计算匹配分数（五维加权）
 */
export function calculateMatchScore(
  task: {
    skills: string[]
    location: Coordinates
    paymentAmount: number
  },
  human: MatchableHuman
): MatchScore {
  const taskSkills = task.skills
  const humanSkills = parseSkills(human.skills).map((skill) => skill.name)

  const matchedSkills = taskSkills.filter((skill) => humanSkills.includes(skill))
  const skillMatch =
    taskSkills.length === 0 ? 100 : (matchedSkills.length / taskSkills.length) * 100

  const locationMatch = human.locationMatch ?? 0
  const ratingMatch = human.user.rating * 20
  const availabilityMatch = human.available ? 100 : 0
  const priceMatch =
    human.hourlyRate > 0
      ? Math.max(0, 100 - (human.hourlyRate / task.paymentAmount) * 50)
      : 50

  const totalScore =
    skillMatch * 0.35 +
    locationMatch * 0.25 +
    ratingMatch * 0.2 +
    availabilityMatch * 0.15 +
    priceMatch * 0.05

  return {
    skillMatch: Math.round(skillMatch),
    locationMatch: Math.round(locationMatch),
    ratingMatch: Math.round(ratingMatch),
    availabilityMatch: Math.round(availabilityMatch),
    priceMatch: Math.round(priceMatch),
    totalScore: Math.round(totalScore),
  }
}

/**
 * 根据匹配度排序（高分在前；同分时近者优先，保证顺序稳定可预期）
 */
export function sortByMatchScore<T extends MatchableHuman & { distance?: number }>(
  humans: T[],
  task: Parameters<typeof calculateMatchScore>[0]
) {
  const scored = humans.map((human) => ({
    ...human,
    score: calculateMatchScore(task, human),
  }))

  return scored.sort((a, b) => {
    if (b.score.totalScore !== a.score.totalScore) {
      return b.score.totalScore - a.score.totalScore
    }
    return (a.distance ?? Number.POSITIVE_INFINITY) -
      (b.distance ?? Number.POSITIVE_INFINITY)
  })
}

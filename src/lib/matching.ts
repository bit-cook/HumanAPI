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

interface MatchableHuman {
  skills: Prisma.JsonValue
  locationMatch?: number
  user: { rating: number }
  available: boolean
  hourlyRate: number
}

function parseSkills(value: Prisma.JsonValue): Skill[] {
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
 * 查找可用的人类专家
 */
export async function findAvailableHumans(params: {
  skills?: string[]
  location?: { lat: number; lon: number }
  maxDistance?: number
  rateMin?: number
  rateMax?: number
  ratingMin?: number
  availableNow?: boolean
}) {
  const {
    skills,
    location,
    maxDistance = 10000,
    rateMin,
    rateMax,
    ratingMin,
    availableNow = true,
  } = params

  const where: Prisma.HumanProfileWhereInput = {
    verified: true,
    ...(availableNow ? { available: true } : {}),
  }

  // 价格筛选
  if (rateMin || rateMax) {
    where.hourlyRate = {}
    if (rateMin) where.hourlyRate.gte = rateMin
    if (rateMax) where.hourlyRate.lte = rateMax
  }

  // 获取所有符合基础条件的专家
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
          email: true,
        },
      },
      wallets: true,
      certifications: true,
    },
  })

  // 技能筛选
  if (skills && skills.length > 0) {
    humans = humans.filter((human) => {
      const humanSkills = parseSkills(human.skills)
      return skills.every((skill) =>
        humanSkills.some((hs) => hs.name === skill && hs.verified)
      )
    })
  }

  // 评分筛选
  if (ratingMin) {
    humans = humans.filter((human) => human.user.rating >= ratingMin)
  }

  // 位置筛选和计算匹配度
  if (location) {
    humans = humans
      .map((human) => {
        const humanLocation = human.location as { lat: number; lon: number }
        const distanceMatch = calculateLocationMatch(
          location,
          humanLocation,
          maxDistance
        )
        return {
          ...human,
          locationMatch: distanceMatch,
          distance: calculateDistance(location, humanLocation),
        }
      })
      .filter((human) => human.locationMatch > 0)
  }

  return humans
}

/**
 * 计算匹配分数
 */
export function calculateMatchScore(
  task: {
    skills: string[]
    location: { lat: number; lon: number }
    paymentAmount: number
  },
  human: MatchableHuman
): MatchScore {
  const taskSkills = task.skills
  const humanSkills = parseSkills(human.skills).map((skill) => skill.name)

  // 技能匹配度
  const matchedSkills = taskSkills.filter((skill) => humanSkills.includes(skill))
  const skillMatch = taskSkills.length === 0
    ? 100
    : (matchedSkills.length / taskSkills.length) * 100

  // 位置匹配度
  const locationMatch = human.locationMatch || 0

  // 评分匹配度（5分=100分）
  const ratingMatch = human.user.rating * 20

  // 可用性匹配度
  const availabilityMatch = human.available ? 100 : 0

  // 价格匹配度
  const priceMatch = human.hourlyRate > 0
    ? Math.max(0, 100 - (human.hourlyRate / task.paymentAmount) * 50)
    : 50

  // 计算总分（权重可调整）
  const totalScore =
    skillMatch * 0.35 +
    locationMatch * 0.25 +
    ratingMatch * 0.20 +
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
 * 根据匹配度排序
 */
export function sortByMatchScore<T extends MatchableHuman>(
  humans: T[],
  task: Parameters<typeof calculateMatchScore>[0]
) {
  const scored = humans.map((human) => ({
    ...human,
    score: calculateMatchScore(task, human),
  }))

  return scored.sort((a, b) => b.score.totalScore - a.score.totalScore)
}

import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { RateLimiter, rateLimitRuleFromEnv } from '@/lib/rate-limit'

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function isAuthorizedRequest(
  request: Pick<NextRequest, 'headers'>
): boolean {
  const expected = process.env.API_KEY
  if (!expected) return false

  const bearer = request.headers.get('authorization')
  const bearerMatch = bearer?.match(/^Bearer\s+(.+)$/i)
  const provided =
    request.headers.get('x-api-key') ?? bearerMatch?.[1] ?? null

  return provided !== null && safeEqual(provided, expected)
}

let limiter: RateLimiter | null = null

/**
 * 限流器惰性初始化：环境变量在模块加载时可能尚未就绪
 * （测试、部分部署脚本）。同一进程内只构造一次。
 */
export function getApiRateLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(rateLimitRuleFromEnv())
  }
  return limiter
}

/** 测试专用：重置限流器使其重新读取环境变量 */
export function resetApiRateLimiterForTest(): void {
  limiter = null
}

/**
 * 所有私有入口的统一守卫：API Key 校验 + 每 Key 限流。
 * 返回 null 表示放行，否则直接作为响应返回。
 */
export function requireApiKey(
  request: Pick<NextRequest, 'headers'>
): NextResponse | null {
  if (!process.env.API_KEY) {
    return NextResponse.json(
      { success: false, error: 'API_KEY is not configured' },
      { status: 503 }
    )
  }

  if (!isAuthorizedRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  const bearer = request.headers.get('authorization')
  const bearerMatch = bearer?.match(/^Bearer\s+(.+)$/i)
  const identifier =
    request.headers.get('x-api-key') ?? bearerMatch?.[1] ?? 'anonymous'
  const verdict = getApiRateLimiter().consume(identifier)

  if (!verdict.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        details: [
          {
            field: 'rateLimit',
            message: `At most ${verdict.limit} requests per window`,
          },
        ],
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(verdict.retryAfterSeconds),
          'X-RateLimit-Limit': String(verdict.limit),
          'X-RateLimit-Remaining': String(verdict.remaining),
          'X-RateLimit-Reset': String(verdict.resetAt),
        },
      }
    )
  }

  return null
}

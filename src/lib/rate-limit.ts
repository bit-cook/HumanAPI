/**
 * 轻量固定窗口限流：按调用方标识（默认 API Key）计数。
 * 单进程内存实现，适合单体参考部署；多副本部署应换共享存储。
 * 时间戳精度为秒，窗口边界自然滑动，无需定时清理。
 */
export interface RateLimitRule {
  max: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** 窗口重置的 Unix 秒 */
  resetAt: number
  retryAfterSeconds: number
}

interface Bucket {
  windowStart: number
  count: number
}

export interface RateLimiterOptions {
  max?: number
  windowMs?: number
  now?: () => number
}

const DEFAULT_MAX = 120
const DEFAULT_WINDOW_MS = 60_000

export class RateLimiter {
  private readonly max: number
  private readonly windowMs: number
  private readonly now: () => number
  private readonly buckets = new Map<string, Bucket>()

  constructor(options: RateLimiterOptions = {}) {
    this.max = options.max && options.max > 0 ? options.max : DEFAULT_MAX
    this.windowMs =
      options.windowMs && options.windowMs > 0 ? options.windowMs : DEFAULT_WINDOW_MS
    this.now = options.now ?? (() => Date.now())
  }

  consume(identifier: string, cost = 1): RateLimitResult {
    const now = this.now()
    const windowMs = this.windowMs
    const windowStart = Math.floor(now / windowMs) * windowMs
    const resetAt = Math.ceil((windowStart + windowMs) / 1000)

    const existing = this.buckets.get(identifier)
    const bucket: Bucket =
      existing && existing.windowStart === windowStart
        ? existing
        : { windowStart, count: 0 }

    bucket.count += cost
    this.buckets.set(identifier, bucket)

    // 顺手清理过期窗口，避免 Map 无限增长
    if (this.buckets.size > 1024) {
      for (const [key, value] of this.buckets) {
        if (value.windowStart !== windowStart) this.buckets.delete(key)
      }
    }

    const success = bucket.count <= this.max
    return {
      success,
      limit: this.max,
      remaining: Math.max(0, this.max - bucket.count),
      resetAt,
      retryAfterSeconds: success ? 0 : Math.max(1, resetAt - Math.floor(now / 1000)),
    }
  }

  reset(): void {
    this.buckets.clear()
  }
}

export function rateLimitRuleFromEnv(
  env: NodeJS.ProcessEnv = process.env
): RateLimitRule {
  const parsedMax = Number.parseInt(env.RATE_LIMIT_MAX ?? '', 10)
  const parsedWindow = Number.parseInt(env.RATE_LIMIT_WINDOW_MS ?? '', 10)
  return {
    max: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : DEFAULT_MAX,
    windowMs:
      Number.isFinite(parsedWindow) && parsedWindow > 0 ? parsedWindow : DEFAULT_WINDOW_MS,
  }
}

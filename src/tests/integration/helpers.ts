import { NextRequest } from 'next/server'

/**
 * 测试凭证必须跟随环境里已配置的 API_KEY（CI 会设置自己的值），
 * 否则会出现"本地通过、CI 全 401"的环境耦合失败。
 * 未配置时落到默认值，保证 `npx vitest` 单独也能跑。
 */
export const TEST_API_KEY = process.env.API_KEY ?? 'integration-test-api-key'
process.env.API_KEY = TEST_API_KEY

/** 真实数据库不可用时跳过，而不是假失败 */
export const hasDatabase = Boolean(process.env.DATABASE_URL)

export const WRONG_API_KEY = 'definitely-not-the-server-key'

export function apiRequest(
  path: string,
  init: { method?: string; body?: string; headers?: Record<string, string>; apiKey?: string } = {}
): NextRequest {
  const { apiKey = TEST_API_KEY, ...rest } = init
  const headers = new Headers(rest.headers)
  if (apiKey) headers.set('authorization', `Bearer ${apiKey}`)
  if (rest.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new NextRequest(`http://localhost${path}`, {
    method: rest.method,
    body: rest.body,
    headers,
  })
}

export function jsonRequest(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  apiKey = TEST_API_KEY
): NextRequest {
  return apiRequest(path, {
    method,
    body: JSON.stringify(body),
    apiKey,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 测试中断言字段动态访问
export async function readJson<T = Record<string, any>>(
  response: Response
): Promise<T> {
  return (await response.json()) as T
}

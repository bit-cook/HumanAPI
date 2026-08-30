import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function isAuthorizedRequest(request: Pick<NextRequest, 'headers'>): boolean {
  const expected = process.env.API_KEY
  if (!expected) return false

  const bearer = request.headers.get('authorization')
  const bearerMatch = bearer?.match(/^Bearer\s+(.+)$/i)
  const provided = request.headers.get('x-api-key') ??
    bearerMatch?.[1] ?? null

  return provided !== null && safeEqual(provided, expected)
}

export function requireApiKey(request: Pick<NextRequest, 'headers'>): NextResponse | null {
  if (!process.env.API_KEY) {
    return NextResponse.json(
      { success: false, error: 'API_KEY is not configured' },
      { status: 503 }
    )
  }
  if (isAuthorizedRequest(request)) return null

  return NextResponse.json(
    { success: false, error: 'Authentication required' },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
  )
}

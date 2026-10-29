import { NextResponse } from 'next/server'

import { APP_VERSION } from '@/lib/version'

/**
 * GET /api/health - 健康检查（liveness，不探测依赖）
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: APP_VERSION,
  })
}

import { NextResponse } from 'next/server'

/**
 * GET /api/health - 健康检查
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  })
}

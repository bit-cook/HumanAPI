import { NextResponse } from 'next/server'

/**
 * GET /api - API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: 'HumanAPI',
    version: '1.0.0',
    description: 'Humans as a Service - 让人类成为可调用的 API',
    baseUrl: process.env.APP_URL || 'http://localhost:3000',
    endpoints: {
      mcp: '/api/mcp',
      humans: '/api/humans',
      tasks: '/api/tasks',
      bookings: '/api/bookings',
    },
    documentation: 'https://github.com/bit-cook/HumanAPI',
  })
}

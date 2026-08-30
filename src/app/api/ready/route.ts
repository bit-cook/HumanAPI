import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ready', version: '1.2.0' })
  } catch {
    return NextResponse.json(
      { status: 'not_ready', version: '1.2.0' },
      { status: 503 }
    )
  }
}

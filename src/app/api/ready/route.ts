import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { APP_VERSION } from '@/lib/version'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ready', version: APP_VERSION })
  } catch {
    return NextResponse.json(
      { status: 'not_ready', version: APP_VERSION },
      { status: 503 }
    )
  }
}

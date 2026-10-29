import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

/**
 * 路由 catch 的统一出口：把 Prisma 已知错误码映射成有意义的 HTTP 状态，
 * 避免"记录不存在"暴露成 500。未知错误记日志并返回通用 500。
 */
export function routeError(
  error: unknown,
  context: string,
  notFoundMessage = 'Resource not found'
): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: 记录不存在（update/delete 的唯一约束未命中）
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: notFoundMessage },
        { status: 404 }
      )
    }
    // P2002: 唯一约束冲突（重复创建）
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Resource already exists' },
        { status: 409 }
      )
    }
    // P2003: 外键约束失败（引用了不存在的关联记录）
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Related record not found' },
        { status: 409 }
      )
    }
  }

  console.error(`${context}:`, error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

/** 业务语义错误：带状态码抛出，路由层只写 catch */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function httpErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    )
  }
  console.error('Unhandled route error:', error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

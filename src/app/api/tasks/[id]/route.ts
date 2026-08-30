import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiKey } from '@/lib/auth'
import { parseJsonBody, updateTaskSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/tasks/:id - 获取任务详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized
  try {
    const { id } = await context.params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        human: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
          },
        },
        booking: {
          include: {
            messages: {
              take: 50,
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tasks/:id - 更新任务
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, updateTaskSchema)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const updated = await prisma.task.updateMany({
      where: { id, status: { in: ['DRAFT', 'OPEN'] }, booking: null },
      data: parsed.data,
    })
    if (updated.count !== 1) {
      return NextResponse.json(
        { success: false, error: 'Only unbooked draft or open tasks can be edited' },
        { status: 409 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, avatar: true } },
        human: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/:id - 删除任务
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const deleted = await prisma.task.deleteMany({
      where: { id, status: { in: ['DRAFT', 'OPEN'] }, booking: null },
    })

    if (deleted.count !== 1) {
      return NextResponse.json(
        { success: false, error: 'Only unbooked draft or open tasks can be deleted' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task',
      },
      { status: 500 }
    )
  }
}

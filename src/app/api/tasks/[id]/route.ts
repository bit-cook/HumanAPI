import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * GET /api/tasks/:id - 获取任务详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params

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
  try {
    const { id } = context.params
    const body = await request.json()

    const task = await prisma.task.update({
      where: { id },
      data: body,
      include: {
        agent: true,
        human: true,
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
  try {
    const { id } = context.params

    await prisma.task.delete({
      where: { id },
    })

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
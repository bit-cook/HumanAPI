import type { BookingStatus, TaskStatus } from '@prisma/client'

/**
 * Booking 生命周期是平台唯一的权威状态机：REST action 路由与 MCP
 * update_booking 都必须引用本表，避免两份定义漂移。
 */
export const bookingActions = [
  'confirm',
  'start',
  'complete',
  'cancel',
  'dispute',
  'resolve',
] as const
export type BookingAction = (typeof bookingActions)[number]

export interface BookingTransition {
  from: readonly BookingStatus[]
  booking: BookingStatus
  /** null 表示 task 状态保持不变 */
  task: TaskStatus | null
  /** 完成类动作：累加专家 totalTasks */
  countsCompletion: boolean
}

const transitions: Record<BookingAction, BookingTransition> = {
  confirm: {
    from: ['PENDING'],
    booking: 'CONFIRMED',
    task: 'ASSIGNED',
    countsCompletion: false,
  },
  start: {
    from: ['CONFIRMED'],
    booking: 'IN_PROGRESS',
    task: 'IN_PROGRESS',
    countsCompletion: false,
  },
  complete: {
    from: ['IN_PROGRESS'],
    booking: 'COMPLETED',
    task: 'COMPLETED',
    countsCompletion: true,
  },
  cancel: {
    from: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
    booking: 'CANCELLED',
    task: 'CANCELLED',
    countsCompletion: false,
  },
  dispute: {
    from: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
    booking: 'DISPUTED',
    task: null,
    countsCompletion: false,
  },
  resolve: {
    from: ['DISPUTED'],
    booking: 'COMPLETED',
    task: 'COMPLETED',
    countsCompletion: true,
  },
}

export function getBookingTransition(
  action: BookingAction,
  current: BookingStatus
): BookingTransition | null {
  const transition = transitions[action]
  return transition.from.includes(current) ? transition : null
}

/** 动作的完整定义（含 task 映射），供 MCP 状态级入口复用 */
export function getBookingTransitionDefinition(
  action: BookingAction
): BookingTransition {
  return transitions[action]
}

/**
 * MCP update_booking 使用的状态级迁移表（目标状态 -> 合法来源）。
 * 与上面的动作表保持等价：动作是状态迁移的语义化封装。
 */
export const bookingStatusTransitions: Readonly<
  Record<BookingStatus, readonly BookingStatus[]>
> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'DISPUTED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
}

export function isValidBookingTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
): boolean {
  return bookingStatusTransitions[currentStatus].includes(nextStatus)
}

/** MCP 目标状态 -> 等价动作，用于复用同一套 task 映射逻辑 */
export function bookingActionForStatus(
  nextStatus: Exclude<BookingStatus, 'PENDING' | 'DISPUTED'>
): BookingAction {
  switch (nextStatus) {
    case 'CONFIRMED':
      return 'confirm'
    case 'IN_PROGRESS':
      return 'start'
    case 'COMPLETED':
      return 'complete'
    case 'CANCELLED':
      return 'cancel'
  }
}

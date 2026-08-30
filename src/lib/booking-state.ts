import type { BookingStatus, TaskStatus } from '@prisma/client'

export const bookingActions = ['confirm', 'start', 'complete', 'cancel'] as const
export type BookingAction = (typeof bookingActions)[number]

const transitions: Record<
  BookingAction,
  { from: readonly BookingStatus[]; booking: BookingStatus; task: TaskStatus }
> = {
  confirm: { from: ['PENDING'], booking: 'CONFIRMED', task: 'ASSIGNED' },
  start: { from: ['CONFIRMED'], booking: 'IN_PROGRESS', task: 'IN_PROGRESS' },
  complete: { from: ['IN_PROGRESS'], booking: 'COMPLETED', task: 'COMPLETED' },
  cancel: {
    from: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
    booking: 'CANCELLED',
    task: 'CANCELLED',
  },
}

export function getBookingTransition(action: BookingAction, current: BookingStatus) {
  const transition = transitions[action]
  return transition.from.includes(current) ? transition : null
}

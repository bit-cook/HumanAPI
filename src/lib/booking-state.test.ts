import { describe, expect, it } from 'vitest'

import {
  bookingActionForStatus,
  bookingStatusTransitions,
  getBookingTransition,
  isValidBookingTransition,
} from './booking-state'

describe('booking state machine', () => {
  it('allows the documented happy path', () => {
    expect(getBookingTransition('confirm', 'PENDING')).toMatchObject({
      booking: 'CONFIRMED',
      task: 'ASSIGNED',
    })
    expect(getBookingTransition('start', 'CONFIRMED')?.booking).toBe(
      'IN_PROGRESS'
    )
    expect(getBookingTransition('complete', 'IN_PROGRESS')).toMatchObject({
      booking: 'COMPLETED',
      task: 'COMPLETED',
      countsCompletion: true,
    })
  })

  it('supports dispute and resolve transitions', () => {
    expect(getBookingTransition('dispute', 'IN_PROGRESS')?.booking).toBe(
      'DISPUTED'
    )
    // 争议不改变 task 状态
    expect(getBookingTransition('dispute', 'IN_PROGRESS')?.task).toBeNull()
    expect(getBookingTransition('resolve', 'DISPUTED')).toMatchObject({
      booking: 'COMPLETED',
      countsCompletion: true,
    })
  })

  it('rejects illegal transitions', () => {
    expect(getBookingTransition('complete', 'PENDING')).toBeNull()
    expect(getBookingTransition('start', 'PENDING')).toBeNull()
    expect(getBookingTransition('resolve', 'COMPLETED')).toBeNull()
    expect(getBookingTransition('dispute', 'COMPLETED')).toBeNull()
  })

  it('keeps the status-level table consistent for MCP callers', () => {
    expect(isValidBookingTransition('PENDING', 'CONFIRMED')).toBe(true)
    expect(isValidBookingTransition('PENDING', 'IN_PROGRESS')).toBe(false)
    expect(isValidBookingTransition('DISPUTED', 'COMPLETED')).toBe(true)
    expect(isValidBookingTransition('DISPUTED', 'PENDING')).toBe(false)
    expect(isValidBookingTransition('COMPLETED', 'CANCELLED')).toBe(false)
    expect(bookingStatusTransitions.COMPLETED).toEqual([])
  })

  it('maps MCP status targets back to equivalent actions', () => {
    expect(bookingActionForStatus('CONFIRMED')).toBe('confirm')
    expect(bookingActionForStatus('IN_PROGRESS')).toBe('start')
    expect(bookingActionForStatus('COMPLETED')).toBe('complete')
    expect(bookingActionForStatus('CANCELLED')).toBe('cancel')
  })
})

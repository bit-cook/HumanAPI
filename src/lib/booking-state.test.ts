import { describe, expect, it } from 'vitest'
import { getBookingTransition } from './booking-state'

describe('booking state transitions', () => {
  it('allows the expected lifecycle', () => {
    expect(getBookingTransition('confirm', 'PENDING')?.booking).toBe('CONFIRMED')
    expect(getBookingTransition('start', 'CONFIRMED')?.booking).toBe('IN_PROGRESS')
    expect(getBookingTransition('complete', 'IN_PROGRESS')?.booking).toBe('COMPLETED')
  })

  it('rejects skips and terminal-state changes', () => {
    expect(getBookingTransition('complete', 'PENDING')).toBeNull()
    expect(getBookingTransition('cancel', 'COMPLETED')).toBeNull()
    expect(getBookingTransition('start', 'CANCELLED')).toBeNull()
  })
})

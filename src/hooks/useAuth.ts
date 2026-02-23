import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      set({ user: data.data.user, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      set({ user: null, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  refresh: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        set({ user: data.data, isLoading: false })
      } else {
        set({ user: null, isLoading: false })
      }
    } catch (error) {
      set({ user: null, isLoading: false })
    }
  },
}))
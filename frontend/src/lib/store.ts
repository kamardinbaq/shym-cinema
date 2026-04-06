// src/lib/store.ts
import { create } from 'zustand'
import type { AuthResponse } from '@/types'

interface AuthState {
  token: string | null
  user: Omit<AuthResponse, 'token' | 'tokenType' | 'expiresIn'> | null
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (auth: AuthResponse) => void
  clearAuth: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,

  setAuth: (auth) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', auth.token)
      localStorage.setItem('user', JSON.stringify({
        username: auth.username,
        role: auth.role,
      }))
    }
    set({
      token: auth.token,
      user: { username: auth.username, role: auth.role },
      isAuthenticated: true,
      isAdmin: auth.role === 'ADMIN',
    })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ token: null, user: null, isAuthenticated: false, isAdmin: false })
  },

  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        // Check if token is expired by decoding the payload
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          return
        }
        const user = JSON.parse(userStr)
        set({ token, user, isAuthenticated: true, isAdmin: user.role === 'ADMIN' })
      } catch (e) {
        console.warn('Failed to restore auth state', e)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },
}))

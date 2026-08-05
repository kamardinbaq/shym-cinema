import { create } from 'zustand'
import type { AdminAuth } from '@/types'

interface AdminState {
  token: string | null
  admin: { username: string; root: boolean } | null
  isAuthenticated: boolean
  isRoot: boolean
  setAuth: (a: AdminAuth) => void
  clearAuth: () => void
  hydrate: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,
  isRoot: false,

  setAuth: (auth) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify({ username: auth.username, root: auth.root }))
    }
    set({
      token: auth.token || 'session',
      admin: { username: auth.username, root: auth.root },
      isAuthenticated: true,
      isRoot: auth.root,
    })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_token')
    }
    set({ token: null, admin: null, isAuthenticated: false, isRoot: false })
  },

  hydrate: () => {
    if (typeof window === 'undefined') return
    const userStr = localStorage.getItem('admin_user')
    if (userStr) {
      try {
        const admin = JSON.parse(userStr)
        set({ token: 'session', admin, isAuthenticated: true, isRoot: Boolean(admin.root) })
      } catch {
        localStorage.removeItem('admin_user')
        localStorage.removeItem('admin_token')
      }
    }
  },
}))

import { create } from 'zustand'
import type { AdminAuth } from '@/types'
interface AdminState {
  token: string | null; admin: { username: string; root: boolean } | null
  isAuthenticated: boolean; isRoot: boolean
  setAuth: (a: AdminAuth) => void; clearAuth: () => void; hydrate: () => void
}
export const useAdminStore = create<AdminState>(set => ({
  token: null, admin: null, isAuthenticated: false, isRoot: false,
  setAuth: auth => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', auth.token)
      localStorage.setItem('admin_user', JSON.stringify({ username: auth.username, root: auth.root }))
    }
    set({ token: auth.token, admin: { username: auth.username, root: auth.root }, isAuthenticated: true, isRoot: auth.root })
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user') }
    set({ token: null, admin: null, isAuthenticated: false, isRoot: false })
  },
  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('admin_token'); const userStr = localStorage.getItem('admin_user')
    if (token && userStr) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]))
        if (p.exp && p.exp * 1000 < Date.now()) { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); return }
        const admin = JSON.parse(userStr)
        set({ token, admin, isAuthenticated: true, isRoot: admin.root })
      } catch { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user') }
    }
  },
}))

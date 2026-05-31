import axios from 'axios'
import type { ApiResponse, AvailabilityGrid, Review, AdminUser, AdminAuth, SiteSettings } from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' }, timeout: 15000 })

api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('admin_token')
    if (t) cfg.headers.Authorization = `Bearer ${t}`
  }
  return cfg
})
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    const url = err.config?.url || ''
    if (!url.includes('/auth/login')) { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user') }
  }
  return Promise.reject(err)
})

export const availabilityApi = {
  getGrid: (date?: string) => api.get<ApiResponse<AvailabilityGrid>>('/api/availability', { params: { date } }),
}
export const questApi = {
  getGrid: (date?: string) => api.get<ApiResponse<AvailabilityGrid>>('/api/availability/quest', { params: { date } }),
}
export const settingsApi = {
  get: () => api.get<ApiResponse<SiteSettings>>('/api/settings'),
}
export const reviewApi = {
  getAll: (venue: 'CINEMA' | 'QUEST' = 'CINEMA') =>
    api.get<ApiResponse<Review[]>>('/api/reviews', { params: { venue } }),
  create: (d: { name?: string; stars: number; body: string; venue?: string }) =>
    api.post<ApiResponse<Review>>('/api/reviews', d),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/admin/reviews/${id}`),
}
export const adminApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<AdminAuth>>('/api/admin/auth/login', { username, password }),
  toggleSlot: (timeSlotId: number, date: string) =>
    api.post<ApiResponse<boolean>>('/api/admin/slots/toggle', null, { params: { timeSlotId, date } }),
  getSettings: () => api.get<ApiResponse<Record<string, string>>>('/api/admin/settings'),
  updateSettings: (s: Record<string, string>) => api.put<ApiResponse<void>>('/api/admin/settings', s),
  getAdmins: () => api.get<ApiResponse<AdminUser[]>>('/api/admin/users'),
  createAdmin: (username: string, password: string) =>
    api.post<ApiResponse<AdminUser>>('/api/admin/users', { username, password }),
  deleteAdmin: (id: number) => api.delete<ApiResponse<void>>(`/api/admin/users/${id}`),
}

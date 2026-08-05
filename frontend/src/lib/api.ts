import type { ApiResponse, AvailabilityGrid, Review, AdminUser, AdminAuth, SiteSettings } from '@/types'

async function request<T>(path: string, options?: RequestInit): Promise<{ data: ApiResponse<T> }> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const json = await res.json()
  if (!res.ok && !json.success) {
    const error: any = new Error(json.message || 'Request failed')
    error.response = { status: res.status, data: json }
    throw error
  }
  return { data: json }
}

export const availabilityApi = {
  getGrid: (date?: string) =>
    request<AvailabilityGrid>(`/api/availability${date ? `?date=${date}` : ''}`),
}

export const questApi = {
  getGrid: (date?: string) =>
    request<AvailabilityGrid>(`/api/availability/quest${date ? `?date=${date}` : ''}`),
}

export const settingsApi = {
  get: () => request<SiteSettings>('/api/settings', { cache: 'no-store' }),
}

export const reviewApi = {
  getAll: (venue: 'CINEMA' | 'QUEST' = 'CINEMA') =>
    request<Review[]>(`/api/reviews?venue=${venue}`),
  create: (d: { name?: string; stars: number; body: string; venue?: string }) =>
    request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(d) }),
  delete: (id: number) => request<void>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<AdminAuth>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<void>('/api/admin/auth/logout', { method: 'POST' }),
  toggleSlot: (timeSlotId: number, date: string) =>
    request<boolean>(`/api/admin/slots/toggle?timeSlotId=${timeSlotId}&date=${date}`, {
      method: 'POST',
    }),
  getSettings: () => request<Record<string, string>>('/api/admin/settings'),
  updateSettings: (s: Record<string, string>) =>
    request<void>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(s) }),
  getAdmins: () => request<AdminUser[]>('/api/admin/users'),
  createAdmin: (username: string, password: string) =>
    request<AdminUser>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  deleteAdmin: (id: number) =>
    request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
}

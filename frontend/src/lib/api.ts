// src/lib/api.ts
import axios from 'axios'
import type { ApiResponse, AuthResponse, AvailabilityGrid, Reservation, Payment } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token from localStorage
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — skip auth endpoints (login/register handle their own errors)
api.interceptors.response.use(
  res => res,
  err => {
    const requestUrl: string = err.config?.url || ''
    if (
      err.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !requestUrl.includes('/api/auth/')
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', { username, password }),

  register: (data: { username: string; email: string; password: string; fullName?: string; phone?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/register', data),
}

// ── Availability ────────────────────────────────────────────
export const availabilityApi = {
  getGrid: (date?: string) =>
    api.get<ApiResponse<AvailabilityGrid>>('/api/availability', { params: { date } }),
}

// ── Reservations ────────────────────────────────────────────
export const reservationApi = {
  getMyReservations: () =>
    api.get<ApiResponse<Reservation[]>>('/api/reservations'),

  getById: (id: number) =>
    api.get<ApiResponse<Reservation>>(`/api/reservations/${id}`),

  create: (data: {
    roomId: number
    timeSlotId: number
    reservationDate: string
    peopleCount: number
    notes?: string
  }) => api.post<ApiResponse<Reservation>>('/api/reservations', data),

  cancel: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/reservations/${id}`),
}

// ── Payments ────────────────────────────────────────────────
export const paymentApi = {
  processKaspi: (data: {
    reservationId: number
    phoneNumber: string
    paymentMethod: string
  }) => api.post<ApiResponse<Payment>>('/api/payments/kaspi', data),
}

// ── Admin ───────────────────────────────────────────────────
export const adminApi = {
  getReservations: (params?: { date?: string; roomId?: number }) =>
    api.get<ApiResponse<Reservation[]>>('/api/admin/reservations', { params }),

  cancelReservation: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/admin/reservations/${id}`),

  createReservation: (data: {
    userId: number
    roomId: number
    timeSlotId: number
    reservationDate: string
    peopleCount: number
    notes?: string
    skipPayment: boolean
  }) => api.post<ApiResponse<Reservation>>('/api/admin/reservations', data),
}

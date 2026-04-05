// src/types/index.ts

export interface Room {
  id: number
  name: string
  description: string
  capacity: number
  minPeople: number
  themeCode: 'LIVING' | 'PASSENGER' | 'DEAD'
  timeSlots: TimeSlot[]
}

export interface TimeSlot {
  id: number
  roomId: number
  startTime: string  // "HH:mm"
  endTime: string
  active: boolean
}

export interface SlotCell {
  timeSlotId: number
  startTime: string
  endTime: string
  status: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'PASSED'
  reservationId: number | null
  slotDate: string            // actual calendar date for this slot (night slots = business day date + 1)
  pendingExpiresAt?: string   // ISO datetime, only present when status=PENDING
}

export interface RoomGridRow {
  roomId: number
  roomName: string
  themeCode: string
  capacity: number
  minPeople: number
  slots: SlotCell[]
}

export interface AvailabilityGrid {
  date: string
  rooms: RoomGridRow[]
}

export interface Reservation {
  id: number
  userId: number
  username: string
  roomId: number
  roomName: string
  timeSlotId: number
  startTime: string
  endTime: string
  reservationDate: string
  peopleCount: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
  notes?: string
  payment?: Payment
  createdAt: string
}

export interface Payment {
  id: number
  reservationId: number
  amount: number
  currency: string
  provider: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  transactionId?: string
  kaspiOrderId?: string
  paidAt?: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  username: string
  email: string
  role: 'USER' | 'ADMIN'
  expiresIn: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  timestamp: string
}

export interface BookingState {
  roomId: number
  roomName: string
  themeCode: string
  timeSlotId: number
  startTime: string
  endTime: string
  date: string
  capacity: number
  minPeople: number
}

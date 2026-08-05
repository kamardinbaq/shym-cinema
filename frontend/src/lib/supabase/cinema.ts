import { supabaseAdmin } from './client'
import type { AvailabilityGrid, RoomGridRow, SlotCell, Review, AdminUser } from '@/types'
import bcrypt from 'bcryptjs'

const CINEMA_DAY_START = '13:00'
const QUEST_DAY_START  = '11:00'
const ALMATY_TZ = 'Asia/Almaty'

const ALLOWED_SETTING_KEYS = new Set([
  'whatsapp_number', 'youtube_url', 'youtube_url_2', 'youtube_url_3', 'hero_bg',
  'quest_whatsapp_number', 'quest_youtube_url', 'quest_youtube_url_3', 'quest_hero_bg',
])

/* ── Date & Time Utilities for Asia/Almaty ────────────────── */

function getNowInAlmaty(): Date {
  const now = new Date()
  const almatyStr = now.toLocaleString('en-US', { timeZone: ALMATY_TZ })
  return new Date(almatyStr)
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/* ── Availability Grid Logic ─────────────────────────────── */

export async function getAvailabilityGrid(
  dateStr?: string,
  type: 'CINEMA' | 'QUEST' = 'CINEMA'
): Promise<AvailabilityGrid> {
  const supabase = supabaseAdmin()
  const date = dateStr || new Date().toISOString().split('T')[0]
  const nextDay = addDaysToIsoDate(date, 1)
  const businessDayStart = type === 'QUEST' ? QUEST_DAY_START : CINEMA_DAY_START
  const bizMins = parseTimeToMinutes(businessDayStart)

  // 1. Fetch active rooms of given type with their active time slots
  const roomsPromise = supabase
    .from('rooms')
    .select(`
      id,
      name,
      theme_code,
      capacity,
      min_people,
      active,
      type,
      time_slots (
        id,
        start_time,
        end_time,
        active
      )
    `)
    .eq('active', true)
    .eq('type', type)
    .order('id')

  // 2. Fetch slot reservations for date and nextDay
  const resPromise = supabase
    .from('slot_reservations')
    .select('time_slot_id, reservation_date')
    .in('reservation_date', [date, nextDay])

  const [{ data: roomsData, error: roomsError }, { data: resData, error: resError }] = await Promise.all([roomsPromise, resPromise])

  if (roomsError) throw new Error(roomsError.message)
  if (resError) throw new Error(resError.message)

  const reservedKeys = new Set(
    (resData || []).map((r) => `${r.time_slot_id}_${r.reservation_date}`)
  )

  const nowAlmaty = getNowInAlmaty()

  // 3. Build room rows & slot cells
  const rows: RoomGridRow[] = (roomsData || []).map((room) => {
    const rawSlots = (room.time_slots || []).filter((ts: any) => ts.active)

    // Sort slots by business day order (night slots after business day start get +1440 mins)
    const sortedSlots = [...rawSlots].sort((a: any, b: any) => {
      const aMins = parseTimeToMinutes(a.start_time)
      const bMins = parseTimeToMinutes(b.start_time)
      const aSort = aMins < bizMins ? aMins + 1440 : aMins
      const bSort = bMins < bizMins ? bMins + 1440 : bMins
      return aSort - bSort
    })

    const cells: SlotCell[] = sortedSlots.map((slot: any) => {
      const startMins = parseTimeToMinutes(slot.start_time)
      const isNightSlot = startMins < bizMins
      const slotDate = isNightSlot ? nextDay : date

      const endMins = parseTimeToMinutes(slot.end_time)
      let endDate = slotDate
      if (endMins < startMins || slot.end_time === '00:00:00' || slot.end_time === '00:00') {
        endDate = addDaysToIsoDate(slotDate, 1)
      }

      // Check if slot end datetime is before current Almaty time
      const [endH, endM] = slot.end_time.split(':').map(Number)
      const slotEndDatetime = new Date(`${endDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`)

      const passed = slotEndDatetime < nowAlmaty
      const reserved = reservedKeys.has(`${slot.id}_${slotDate}`)

      const status: 'AVAILABLE' | 'RESERVED' | 'PASSED' = passed
        ? 'PASSED'
        : reserved
        ? 'RESERVED'
        : 'AVAILABLE'

      return {
        timeSlotId: Number(slot.id),
        startTime: slot.start_time.substring(0, 5),
        endTime: slot.end_time.substring(0, 5),
        status,
        slotDate,
      }
    })

    return {
      roomId: Number(room.id),
      roomName: room.name,
      themeCode: room.theme_code,
      capacity: room.capacity,
      minPeople: room.min_people,
      slots: cells,
    }
  })

  return {
    date,
    rooms: rows,
  }
}

/* ── Slot Toggling (Admin) ────────────────────────────────── */

export async function toggleSlot(timeSlotId: number, date: string): Promise<boolean> {
  const supabase = supabaseAdmin()

  // Find existing reservation
  const { data: existing } = await supabase
    .from('slot_reservations')
    .select('id')
    .eq('time_slot_id', timeSlotId)
    .eq('reservation_date', date)
    .maybeSingle()

  if (existing) {
    // Delete reservation -> returns false (now available)
    await supabase.from('slot_reservations').delete().eq('id', existing.id)
    return false
  }

  // Get time slot to know room_id
  const { data: slot, error } = await supabase
    .from('time_slots')
    .select('room_id')
    .eq('id', timeSlotId)
    .single()

  if (error || !slot) throw new Error(`Time slot ${timeSlotId} not found`)

  // Insert reservation -> returns true (now reserved)
  await supabase.from('slot_reservations').insert({
    room_id: slot.room_id,
    time_slot_id: timeSlotId,
    reservation_date: date,
  })

  return true
}

/* ── Settings ─────────────────────────────────────────────── */

export async function getSettings(): Promise<Record<string, string>> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) throw new Error(error.message)

  const result: Record<string, string> = {}
  for (const s of data || []) {
    result[s.key] = s.value
  }
  return result
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  const supabase = supabaseAdmin()

  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      throw new Error(`Unknown setting key: ${key}`)
    }
    await supabase.from('settings').upsert({ key, value })
  }
}

/* ── Reviews ──────────────────────────────────────────────── */

export async function getAllReviews(venue: string = 'CINEMA'): Promise<Review[]> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('venue', venue.toUpperCase())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((r: any) => ({
    id: Number(r.id),
    name: r.name,
    stars: r.stars,
    body: r.body,
    venue: r.venue,
    createdAt: r.created_at,
  }))
}

export async function createReview(req: {
  name?: string
  stars: number
  body: string
  venue?: string
}): Promise<Review> {
  const supabase = supabaseAdmin()
  const venue = req.venue && req.venue.trim() ? req.venue.toUpperCase() : 'CINEMA'

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      name: req.name || null,
      stars: req.stars,
      body: req.body,
      venue,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: Number(data.id),
    name: data.name,
    stars: data.stars,
    body: data.body,
    venue: data.venue,
    createdAt: data.created_at,
  }
}

export async function deleteReview(id: number): Promise<void> {
  const supabase = supabaseAdmin()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ── Admin Management (Root only) ─────────────────────────── */

export async function getAllAdmins(): Promise<AdminUser[]> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('admins')
    .select('id, username, is_root, created_at')
    .order('id')

  if (error) throw new Error(error.message)

  return (data || []).map((a: any) => ({
    id: Number(a.id),
    username: a.username,
    root: Boolean(a.is_root),
    createdAt: a.created_at,
  }))
}

export async function createAdmin(username: string, password: string): Promise<AdminUser> {
  const supabase = supabaseAdmin()

  // Check unique username
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    throw new Error(`Username already taken: ${username}`)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('admins')
    .insert({
      username,
      password: hashedPassword,
      is_root: false,
    })
    .select('id, username, is_root, created_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: Number(data.id),
    username: data.username,
    root: Boolean(data.is_root),
    createdAt: data.created_at,
  }
}

export async function deleteAdmin(id: number, currentUsername: string): Promise<void> {
  const supabase = supabaseAdmin()

  const { data: targetAdmin, error: fetchErr } = await supabase
    .from('admins')
    .select('username, is_root')
    .eq('id', id)
    .single()

  if (fetchErr || !targetAdmin) throw new Error('Admin user not found')
  if (targetAdmin.is_root) throw new Error('Cannot delete root admin')
  if (targetAdmin.username === currentUsername) throw new Error('Cannot delete yourself')

  const { error } = await supabase.from('admins').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

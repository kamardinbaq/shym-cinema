import fs from 'fs'
import path from 'path'
import type { AvailabilityGrid, RoomGridRow, SlotCell, Review, AdminUser } from '@/types'

const DB_PATH = path.join(process.cwd(), '.local-db.json')

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error('Local DB not found. Run "node seed-local.js" first.')
  }
  const content = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(content)
}

function writeDb(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

const CINEMA_DAY_START = '13:00'
const QUEST_DAY_START  = '11:00'
const ALMATY_TZ = 'Asia/Almaty'

const ALLOWED_SETTING_KEYS = new Set([
  'whatsapp_number', 'youtube_url', 'youtube_url_2', 'youtube_url_3', 'hero_bg',
  'quest_whatsapp_number', 'quest_youtube_url', 'quest_youtube_url_2', 'quest_youtube_url_3', 'quest_hero_bg',
])

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

export async function getAvailabilityGrid(
  dateStr?: string,
  type: 'CINEMA' | 'QUEST' = 'CINEMA'
): Promise<AvailabilityGrid> {
  const db = readDb()
  const date = dateStr || new Date().toISOString().split('T')[0]
  const nextDay = addDaysToIsoDate(date, 1)
  const businessDayStart = type === 'QUEST' ? QUEST_DAY_START : CINEMA_DAY_START
  const bizMins = parseTimeToMinutes(businessDayStart)

  const activeRooms = db.rooms.filter((r: any) => r.active && r.type === type)
  const resData = db.slot_reservations.filter((r: any) => r.reservation_date === date || r.reservation_date === nextDay)

  const reservedKeys = new Set(
    resData.map((r: any) => `${r.time_slot_id}_${r.reservation_date}`)
  )

  const nowAlmaty = getNowInAlmaty()

  const rows: RoomGridRow[] = activeRooms.map((room: any) => {
    const rawSlots = db.time_slots.filter((ts: any) => ts.room_id === room.id && ts.active)

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

  return { date, rooms: rows }
}

export async function toggleSlot(timeSlotId: number, date: string): Promise<boolean> {
  const db = readDb()

  const existingIdx = db.slot_reservations.findIndex((r: any) => r.time_slot_id === timeSlotId && r.reservation_date === date)
  if (existingIdx !== -1) {
    db.slot_reservations.splice(existingIdx, 1)
    writeDb(db)
    return false
  }

  const slot = db.time_slots.find((ts: any) => ts.id === timeSlotId)
  if (!slot) throw new Error(`Time slot ${timeSlotId} not found`)

  db.slot_reservations.push({
    id: Date.now(),
    room_id: slot.room_id,
    time_slot_id: timeSlotId,
    reservation_date: date,
  })

  writeDb(db)
  return true
}

export async function getSettings(): Promise<Record<string, string>> {
  const db = readDb()
  const result: Record<string, string> = {}
  for (const s of db.settings) {
    result[s.key] = s.value
  }
  return result
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  const db = readDb()
  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      throw new Error(`Unknown setting key: ${key}`)
    }
    const setting = db.settings.find((s: any) => s.key === key)
    if (setting) {
      setting.value = value
    } else {
      db.settings.push({ key, value })
    }
  }
  writeDb(db)
}

export async function getAllReviews(venue: string = 'CINEMA'): Promise<Review[]> {
  const db = readDb()
  const venueUpper = venue.toUpperCase()
  const reviews = db.reviews.filter((r: any) => r.venue === venueUpper)
  reviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return reviews.map((r: any) => ({
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
  const db = readDb()
  const venue = req.venue && req.venue.trim() ? req.venue.toUpperCase() : 'CINEMA'

  const newReview = {
    id: Date.now(),
    name: req.name || null,
    stars: req.stars,
    body: req.body,
    venue,
    created_at: new Date().toISOString(),
  }

  db.reviews.push(newReview)
  writeDb(db)

  return {
    id: Number(newReview.id),
    name: newReview.name,
    stars: newReview.stars,
    body: newReview.body,
    venue: newReview.venue,
    createdAt: newReview.created_at,
  }
}

export async function deleteReview(id: number): Promise<void> {
  const db = readDb()
  const idx = db.reviews.findIndex((r: any) => r.id === id)
  if (idx !== -1) {
    db.reviews.splice(idx, 1)
    writeDb(db)
  } else {
    throw new Error('Review not found')
  }
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  const db = readDb()
  return db.admins.map((a: any) => ({
    id: Number(a.id),
    username: a.username,
    root: Boolean(a.is_root),
    createdAt: a.created_at,
  }))
}

export async function createAdmin(username: string, password: string): Promise<AdminUser> {
  const db = readDb()
  
  if (db.admins.find((a: any) => a.username === username)) {
    throw new Error(`Username already taken: ${username}`)
  }

  // Use a dummy hash for local dev to avoid importing bcryptjs which hangs Webpack
  const hashedPassword = 'mock_hash_' + password

  const newAdmin = {
    id: Date.now(),
    username,
    password: hashedPassword,
    is_root: false,
    created_at: new Date().toISOString(),
  }

  db.admins.push(newAdmin)
  writeDb(db)

  return {
    id: Number(newAdmin.id),
    username: newAdmin.username,
    root: Boolean(newAdmin.is_root),
    createdAt: newAdmin.created_at,
  }
}

export async function deleteAdmin(id: number, currentUsername: string): Promise<void> {
  const db = readDb()
  const targetAdmin = db.admins.find((a: any) => a.id === id)

  if (!targetAdmin) throw new Error('Admin user not found')
  if (targetAdmin.is_root) throw new Error('Cannot delete root admin')
  if (targetAdmin.username === currentUsername) throw new Error('Cannot delete yourself')

  db.admins = db.admins.filter((a: any) => a.id !== id)
  writeDb(db)
}

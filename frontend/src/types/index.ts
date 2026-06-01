export type Language = 'ru' | 'kz'
export interface SlotCell {
  timeSlotId: number; startTime: string; endTime: string
  status: 'AVAILABLE' | 'RESERVED' | 'PASSED'; slotDate: string
}
export interface RoomGridRow {
  roomId: number; roomName: string; themeCode: string
  capacity: number; minPeople: number; slots: SlotCell[]
}
export interface AvailabilityGrid { date: string; rooms: RoomGridRow[] }
export interface Review { id: number; name?: string; stars: number; body: string; createdAt: string; venue?: string }
export interface AdminUser { id: number; username: string; root: boolean; createdAt: string }
export interface AdminAuth { token: string; username: string; root: boolean }
export interface ApiResponse<T> { success: boolean; message?: string; data: T }
export interface SiteSettings {
  whatsapp_number: string; youtube_url: string; youtube_url_2?: string; hero_bg?: string
  quest_whatsapp_number?: string; quest_youtube_url?: string; quest_hero_bg?: string
}

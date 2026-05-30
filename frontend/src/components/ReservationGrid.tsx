'use client'
import type { AvailabilityGrid, RoomGridRow, SlotCell, Language } from '@/types'
import { Ghost, Train, Skull, Check, Lock, Clock, type LucideIcon } from 'lucide-react'

const THEME_META: Record<string, { themeClass: string; Icon: LucideIcon; tagline: { ru: string; kz: string } }> = {
  LIVING:    { themeClass: 'theme-living',    Icon: Ghost, tagline: { ru: 'Живые комнаты — страх рядом',      kz: 'Тірі бөлмелер — қорқыныш жақын' } },
  PASSENGER: { themeClass: 'theme-passenger', Icon: Train, tagline: { ru: 'Максимальный уровень страха',      kz: 'Максималды қорқыныш деңгейі' } },
  DEAD:      { themeClass: 'theme-dead',      Icon: Skull, tagline: { ru: 'Замкнутое пространство',           kz: 'Жабық кеңістік' } },
}

const STATUS_LABEL = {
  ru: { AVAILABLE: 'Свободно', RESERVED: 'Занято', PASSED: 'Прошёл' },
  kz: { AVAILABLE: 'Бос',     RESERVED: 'Бронь',  PASSED: 'Өтті' },
}

interface Props {
  grid:            AvailabilityGrid
  lang:            Language
  whatsappNumber:  string
  /** If provided → admin mode: click any non-PASSED slot to toggle reservation */
  onAdminToggle?:  (timeSlotId: number, date: string) => void
}

function buildWaUrl(number: string, room: string, date: string, start: string, end: string, lang: Language) {
  const clean = number.replace(/\D/g, '')
  const msg = lang === 'kz'
    ? `Брондағым келеді: ${room}, ${date}, ${start}–${end}`
    : `Хочу забронировать: ${room}, ${date}, ${start}–${end}`
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
}

export default function ReservationGrid({ grid, lang, whatsappNumber, onAdminToggle }: Props) {
  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {grid.rooms.map((room, i) => (
        <div key={room.roomId} className="animate-float-up" style={{ animationDelay: `${i * 80}ms` }}>
          <RoomCard room={room} date={grid.date} lang={lang}
            whatsappNumber={whatsappNumber} onAdminToggle={onAdminToggle} />
        </div>
      ))}
    </div>
  )
}

function RoomCard({ room, date, lang, whatsappNumber, onAdminToggle }:
  { room: RoomGridRow; date: string; lang: Language; whatsappNumber: string; onAdminToggle?: Props['onAdminToggle'] }) {
  const meta   = THEME_META[room.themeCode] ?? THEME_META.LIVING
  const Icon   = meta.Icon
  const avail  = room.slots.filter(s => s.status === 'AVAILABLE').length
  const labels = STATUS_LABEL[lang]
  return (
    <article className={`room-card ${meta.themeClass} h-full flex flex-col`}>
      <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
        <div className="flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0"
          style={{ background: 'var(--theme-accent-dim)', border: '1px solid var(--theme-accent)' }}>
          <Icon className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[15px] text-white tracking-wider uppercase leading-tight truncate">
            {room.roomName}
          </h3>
          <p className="font-body text-[11px] text-bone-dark/65 mt-0.5 truncate">{meta.tagline[lang]}</p>
        </div>
      </header>
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-bone-dark/70 tracking-wider border-b border-white/5">
        <span>{room.minPeople}–{room.capacity} {lang === 'kz' ? 'адам' : 'чел.'}</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${avail > 0 ? 'bg-green-400 animate-pulse-soft' : 'bg-red-800'}`} />
          {avail > 0 ? `${avail} ${labels.AVAILABLE.toLowerCase()}` : (lang === 'kz' ? 'бос жоқ' : 'нет мест')}
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2.5 flex-1">
        {room.slots.map(slot => (
          <SlotButton key={slot.timeSlotId} slot={slot} room={room} date={date}
            lang={lang} labels={labels} whatsappNumber={whatsappNumber} onAdminToggle={onAdminToggle} />
        ))}
      </div>
    </article>
  )
}

function SlotButton({ slot, room, date, lang, labels, whatsappNumber, onAdminToggle }:
  { slot: SlotCell; room: RoomGridRow; date: string; lang: Language
    labels: typeof STATUS_LABEL['ru']; whatsappNumber: string; onAdminToggle?: Props['onAdminToggle'] }) {

  const available = slot.status === 'AVAILABLE'
  const reserved  = slot.status === 'RESERVED'
  const passed    = slot.status === 'PASSED'
  const isAdmin   = !!onAdminToggle

  // In admin mode all non-PASSED slots are clickable
  const clickable = isAdmin ? !passed : available

  const stateClass = available ? 'slot-available' : reserved ? 'slot-reserved' : 'slot-passed'

  // Night slots can have slotDate different from date
  const actualDate = slot.slotDate || date
  const isNextDay  = actualDate !== date

  function handleClick() {
    if (!clickable) return
    if (isAdmin) { onAdminToggle!(slot.timeSlotId, actualDate); return }
    window.open(buildWaUrl(whatsappNumber, room.roomName, actualDate, slot.startTime, slot.endTime, lang), '_blank')
  }

  return (
    <button
      disabled={!clickable}
      onClick={handleClick}
      className={`${stateClass} relative rounded-xl overflow-hidden transition-all duration-200 min-h-[96px] px-2 py-3 flex flex-col items-center justify-center gap-1 ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      style={{ touchAction: 'manipulation' }}
    >
      {isNextDay && (
        <span className="font-mono text-[8px] tracking-wider text-bone-dark/50 mb-0.5">
          {formatSlotDate(actualDate)}
        </span>
      )}

      {/* ── Equal-size start / end times ── */}
      <div className="flex flex-col items-center leading-none gap-0.5">
        <span className="font-mono text-[18px] font-bold tracking-wide text-white">{slot.startTime}</span>
        <span className="font-mono text-[12px] font-bold tracking-wide text-white">до</span>
        <span className="font-mono text-[12px] font-bold tracking-wide text-gray">{slot.endTime}</span>
      </div>

      {/* Status badge */}
      {available && !isAdmin && (
        <span className="mt-1 font-mono text-[9px] tracking-[0.18em] uppercase text-green-400/90 flex items-center gap-1">
          <Check className="w-2.5 h-2.5" /> {labels.AVAILABLE}
        </span>
      )}
      {available && isAdmin && (
        <span className="mt-1 font-mono text-[9px] tracking-widest uppercase text-green-400/80">✓ Бос</span>
      )}
      {reserved && (
        <>
          <span className="mt-1 font-mono text-[9px] tracking-widest uppercase text-red-500/70 flex items-center gap-1 relative z-10">
            <Lock className="w-2.5 h-2.5" />
            {isAdmin ? 'Брондалған' : labels.RESERVED}
          </span>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-35">
            <line x1="18" y1="18" x2="82" y2="82" stroke="#cc0000" strokeWidth="4" strokeLinecap="round"/>
            <line x1="82" y1="18" x2="18" y2="82" stroke="#cc0000" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </>
      )}
      {passed && (
        <span className="mt-1 font-mono text-[9px] tracking-widest uppercase text-bone-dark/25 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {labels.PASSED}
        </span>
      )}
      {available && !isAdmin && <span className="pulse-ring" aria-hidden="true" />}
    </button>
  )
}

function formatSlotDate(iso: string) {
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${months[parseInt(m)-1]}`
}

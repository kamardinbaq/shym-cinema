'use client'
import { useEffect, useState } from 'react'
import type { AvailabilityGrid, BookingState, RoomGridRow, SlotCell } from '@/types'
import { Users, Clock, Skull, Ghost, Train, Lock, Check, type LucideIcon } from 'lucide-react'

function useCountdown(expiresAt?: string): string | null {
  const [display, setDisplay] = useState<string | null>(null)

  useEffect(() => {
    if (!expiresAt) return

    const tick = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      if (diff <= 0) {
        setDisplay('00:00')
      } else {
        const m = String(Math.floor(diff / 60)).padStart(2, '0')
        const s = String(diff % 60).padStart(2, '0')
        setDisplay(`${m}:${s}`)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return display
}

interface Props {
  grid: AvailabilityGrid
  onSlotClick: (booking: BookingState) => void
  /** Called when a logged-in user clicks their own PENDING slot — passes its reservationId */
  onPendingSlotClick?: (reservationId: number) => void
}

/* ── Theme metadata: icon, label, tagline ─────────────── */
const THEME_META: Record<
  string,
  { themeClass: string; Icon: LucideIcon; label: string; tagline: string; level: string }
> = {
  LIVING: {
    themeClass: 'theme-living',
    Icon: Ghost,
    label: 'LIVING',
    tagline: 'Живые комнаты — страх рядом',
    level: 'LVL 1-MAX',
  },
  PASSENGER: {
    themeClass: 'theme-passenger',
    Icon: Train,
    label: 'PASSENGER',
    tagline: 'Максимальный уровень страха',
    level: 'LVL 1-MAX',
  },
  DEAD: {
    themeClass: 'theme-dead',
    Icon: Skull,
    label: 'DEAD',
    tagline: 'Замкнутое пространство',
    level: 'LVL 1-MAX',
  },
}

export default function ReservationGrid({ grid, onSlotClick, onPendingSlotClick }: Props) {
  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {grid.rooms.map((room, i) => (
        <div
          key={room.roomId}
          className="animate-float-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <RoomCard
            room={room}
            date={grid.date}
            onSlotClick={onSlotClick}
            onPendingSlotClick={onPendingSlotClick}
          />
        </div>
      ))}
    </div>
  )
}

function RoomCard({
  room, date, onSlotClick, onPendingSlotClick,
}: {
  room: RoomGridRow
  date: string
  onSlotClick: (b: BookingState) => void
  onPendingSlotClick?: (reservationId: number) => void
}) {
  const meta = THEME_META[room.themeCode] ?? THEME_META.LIVING
  const Icon = meta.Icon

  const availableCount = room.slots.filter(s => s.status === 'AVAILABLE').length

  return (
    <article className={`room-card ${meta.themeClass} h-full flex flex-col`}>
      {/* Header — theme identity */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0"
          style={{
            background: 'var(--theme-accent-dim)',
            border: '1px solid var(--theme-accent)',
          }}
        >
          <Icon className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-[15px] text-white tracking-wider uppercase leading-tight truncate">
              {room.roomName}
            </h3>
            <span
              className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0"
              style={{
                color: 'var(--theme-accent)',
                borderColor: 'var(--theme-accent)',
                background: 'var(--theme-accent-dim)',
              }}
            >
              {meta.level}
            </span>
          </div>
          <p className="font-body text-[11px] text-bone-dark/65 mt-0.5 truncate">
            {meta.tagline}
          </p>
        </div>
      </header>

      {/* Meta row: capacity + availability count */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-bone-dark/70 tracking-wider border-b border-white/5">
        <span className="flex items-center gap-1.5">
          <Users className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
          {room.minPeople}–{room.capacity} чел.
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${availableCount > 0 ? 'bg-green-400 animate-pulse-soft' : 'bg-red-800'}`}
          />
          {availableCount > 0 ? `${availableCount} свободно` : 'нет мест'}
        </span>
      </div>

      {/* Slots grid — fixed 2 columns */}
      <div className="p-3 grid grid-cols-2 gap-2.5 flex-1">
        {room.slots.map(slot => (
          <SlotButton
            key={slot.timeSlotId}
            slot={slot}
            room={room}
            date={date}
            onSlotClick={onSlotClick}
            onPendingSlotClick={onPendingSlotClick}
          />
        ))}
      </div>
    </article>
  )
}

/** "2026-04-13" → "13 апреля" */
function formatSlotDate(iso: string): string {
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

function SlotButton({
  slot, room, date, onSlotClick, onPendingSlotClick,
}: {
  slot: SlotCell
  room: RoomGridRow
  date: string
  onSlotClick: (b: BookingState) => void
  onPendingSlotClick?: (reservationId: number) => void
}) {
  const available = slot.status === 'AVAILABLE'
  const passed    = slot.status === 'PASSED'
  const pending   = slot.status === 'PENDING'
  const reserved  = slot.status === 'RESERVED'

  // Pending is clickable only when a callback is provided and slot has a reservationId
  // (meaning it belongs to the current user, verified by the parent)
  const pendingClickable = pending && !!onPendingSlotClick && !!slot.reservationId

  const countdown = useCountdown(pending ? slot.pendingExpiresAt : undefined)

  // Night slots (01:00–04:00) have slotDate = business day + 1. Always use slotDate from backend.
  const actualDate = slot.slotDate || date

  const stateClass =
    available ? 'slot-available'
    : pending ? 'slot-pending'
    : reserved ? 'slot-reserved'
    : 'slot-passed'

  const tooltip = available        ? `Забронировать ${slot.startTime}–${slot.endTime}`
                : pendingClickable ? 'Продолжить оплату'
                : pending          ? 'Ожидает оплаты — скоро освободится'
                : passed           ? 'Сеанс уже прошёл'
                :                    'Занято'

  return (
    <button
      disabled={!available && !pendingClickable}
      onClick={() => {
        if (available) {
          onSlotClick({
            roomId:     room.roomId,
            roomName:   room.roomName,
            themeCode:  room.themeCode,
            timeSlotId: slot.timeSlotId,
            startTime:  slot.startTime,
            endTime:    slot.endTime,
            date:       actualDate,
            capacity:   room.capacity,
            minPeople:  room.minPeople,
          })
        } else if (pendingClickable) {
          onPendingSlotClick!(slot.reservationId!)
        }
      }}
      title={tooltip}
      aria-label={tooltip}
      className={`${stateClass} relative rounded-xl overflow-hidden transition-all duration-200 min-h-[92px] px-2 py-3 flex flex-col items-center justify-center gap-1 ${
        available || pendingClickable ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Next-day label — only shown when slot falls on a different calendar date */}
      {slot.slotDate && slot.slotDate !== date && (
        <span className="font-mono text-[9px] tracking-wider text-bone-dark/60 leading-none mb-0.5">
          {formatSlotDate(slot.slotDate)}*
        </span>
      )}

      {/* Time range (primary) */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-mono text-[20px] font-bold tracking-wide text-white">
          {slot.startTime}
        </span>
        <span className="font-mono text-[10px] text-bone-dark/50 tracking-wider mt-0.5">
          до {slot.endTime}
        </span>
      </div>

      {/* State badge */}
      {available && (
        <span className="mt-1 font-mono text-[9px] tracking-[0.18em] uppercase text-green-400/90 flex items-center gap-1">
          <Check className="w-2.5 h-2.5" /> Забронировать
        </span>
      )}

      {pending && (
        <>
          <span className="mt-0.5 font-mono text-[12px] font-bold text-amber-300">
            {countdown ?? '...'}
          </span>
          <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-amber-500/80">
            {pendingClickable ? 'ОПЛАТИТЬ' : 'ОЖИДАНИЕ'}
          </span>
        </>
      )}

      {passed && (
        <span className="mt-1 font-mono text-[9px] tracking-[0.2em] uppercase text-bone-dark/25 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Прошёл
        </span>
      )}

      {reserved && (
        <>
          <span className="mt-1 font-mono text-[9px] tracking-[0.2em] uppercase text-red-500/70 flex items-center gap-1 relative z-10">
            <Lock className="w-2.5 h-2.5" /> Занято
          </span>
          {/* X overlay — marks reserved visually */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          >
            <line x1="18" y1="18" x2="82" y2="82" stroke="#cc0000" strokeWidth="4" strokeLinecap="round" />
            <line x1="82" y1="18" x2="18" y2="82" stroke="#cc0000" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </>
      )}

      {/* Pulse ring for available slots — signals interactivity */}
      {available && <span className="pulse-ring" aria-hidden="true" />}
    </button>
  )
}

'use client'
import { useEffect, useState } from 'react'
import type { AvailabilityGrid, BookingState, RoomGridRow, SlotCell } from '@/types'

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
}

export default function ReservationGrid({ grid, onSlotClick }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {grid.rooms.map(room => (
        <RoomCard key={room.roomId} room={room} date={grid.date} onSlotClick={onSlotClick} />
      ))}
    </div>
  )
}

function RoomCard({
  room, date, onSlotClick,
}: {
  room: RoomGridRow
  date: string
  onSlotClick: (b: BookingState) => void
}) {
  return (
    <div style={{
      background: 'rgba(12,0,0,0.85)',
      border: '1px solid rgba(204,0,0,0.35)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Room name header */}
      <div style={{
        padding: '14px 16px 10px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(204,0,0,0.2)',
        background: 'rgba(204,0,0,0.06)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          letterSpacing: '0.2em',
          color: '#fff',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          {room.roomName}
        </h3>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'rgba(204,0,0,0.6)',
          letterSpacing: '0.15em',
          marginTop: '3px',
        }}>
          {room.minPeople}–{room.capacity} чел.
        </p>
      </div>

      {/* Slots grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        padding: '12px',
      }}>
        {room.slots.map(slot => (
          <SlotButton
            key={slot.timeSlotId}
            slot={slot}
            room={room}
            date={date}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  )
}

function SlotButton({
  slot, room, date, onSlotClick,
}: {
  slot: SlotCell
  room: RoomGridRow
  date: string
  onSlotClick: (b: BookingState) => void
}) {
  const available = slot.status === 'AVAILABLE'
  const passed    = slot.status === 'PASSED'
  const pending   = slot.status === 'PENDING'

  const countdown = useCountdown(pending ? slot.pendingExpiresAt : undefined)

  // Night slots (01:00–04:00) have slotDate = business day + 1. Always use slotDate from backend.
  const actualDate = slot.slotDate || date

  const bgColor     = available ? 'rgba(0,40,0,0.25)'
                    : pending   ? 'rgba(40,35,0,0.4)'
                    : passed    ? 'rgba(20,20,20,0.3)'
                    :             'rgba(30,0,0,0.3)'
  const borderColor = available ? 'rgba(0,180,0,0.25)'
                    : pending   ? 'rgba(200,160,0,0.45)'
                    : passed    ? 'rgba(80,80,80,0.25)'
                    :             'rgba(204,0,0,0.2)'
  const timeColor   = available ? '#e8dcc8'
                    : pending   ? 'rgba(220,180,60,0.7)'
                    : passed    ? 'rgba(200,180,160,0.25)'
                    :             'rgba(200,180,160,0.45)'

  const tooltip = available ? `Забронировать ${slot.startTime}–${slot.endTime}`
                : pending   ? 'Ожидает оплаты — скоро освободится'
                : passed    ? 'Сеанс уже прошёл'
                :              'Занято'

  return (
    <button
      disabled={!available}
      onClick={() => {
        if (!available) return
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
      }}
      style={{
        position: 'relative',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '14px 8px',
        cursor: available ? 'pointer' : 'not-allowed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        transition: 'all 0.18s ease',
        overflow: 'hidden',
        /* Larger touch target on mobile */
        minHeight: '80px',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
      onMouseEnter={e => {
        if (!available) return
        const el = e.currentTarget
        el.style.background = 'rgba(0,80,0,0.4)'
        el.style.borderColor = 'rgba(0,220,0,0.5)'
        el.style.boxShadow = '0 0 12px rgba(0,200,0,0.2)'
      }}
      onMouseLeave={e => {
        if (!available) return
        const el = e.currentTarget
        el.style.background = bgColor
        el.style.borderColor = borderColor
        el.style.boxShadow = 'none'
      }}
      title={tooltip}
    >
      {/* Time display */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '18px',
        fontWeight: 'bold',
        color: timeColor,
        letterSpacing: '0.05em',
        lineHeight: 1,
      }}>
        {slot.startTime}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: available ? 'rgba(200,180,160,0.4)' : 'rgba(200,180,160,0.2)',
        letterSpacing: '0.1em',
      }}>
        {slot.endTime}
      </span>

      {/* Big red X for reserved slots */}
      {slot.status === 'RESERVED' && (
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.55,
            pointerEvents: 'none',
          }}
        >
          <line x1="15" y1="15" x2="85" y2="85" stroke="#cc0000" strokeWidth="10" strokeLinecap="round" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="#cc0000" strokeWidth="10" strokeLinecap="round" />
        </svg>
      )}

      {/* PENDING — yellow countdown */}
      {pending && (
        <>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 'bold',
            color: 'rgba(220,180,60,0.9)',
            letterSpacing: '0.08em',
            marginTop: '2px',
          }}>
            {countdown ?? '...'}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '7px',
            color: 'rgba(200,160,40,0.6)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            ОЖИДАНИЕ
          </span>
        </>
      )}

      {/* PASSED label */}
      {passed && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          color: 'rgba(120,120,120,0.6)',
          letterSpacing: '0.2em',
          marginTop: '4px',
          textTransform: 'uppercase',
        }}>
          ПРОШЁЛ
        </span>
      )}

      {/* BOOK label for available */}
      {available && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          color: 'rgba(74,222,128,0.7)',
          letterSpacing: '0.2em',
          marginTop: '4px',
          textTransform: 'uppercase',
        }}>
          BOOK
        </span>
      )}
    </button>
  )
}

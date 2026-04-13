'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { reservationApi } from '@/lib/api'
import type { BookingState, Reservation } from '@/types'
import PaymentModal from './PaymentModal'
import { useAuthStore } from '@/lib/store'
import {
  X, Users, Clock, Calendar, ChevronRight,
  Ghost, Train, Skull, Minus, Plus, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  booking: BookingState
  sessionPrice: number
  onClose: () => void
  onComplete: () => void
}

const THEME_META: Record<string, { Icon: LucideIcon; label: string; accent: string }> = {
  LIVING:    { Icon: Ghost, label: 'LIVING ROOM',    accent: '#dc143c' },
  PASSENGER: { Icon: Train, label: 'PASSENGER ROOM', accent: '#c27b47' },
  DEAD:      { Icon: Skull, label: 'DEAD ROOM',      accent: '#9b4bb0' },
}

export default function BookingModal({ booking, sessionPrice, onClose, onComplete }: Props) {
  const { isAdmin } = useAuthStore()
  const [step, setStep]             = useState<'details' | 'payment'>('details')
  const [people, setPeople]         = useState(booking.minPeople)
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)

  const meta = THEME_META[booking.themeCode] ?? THEME_META.LIVING
  const Icon = meta.Icon

  const handleReserve = async () => {
    // Reservation already created (user went Back from PaymentModal) — skip API call
    if (reservation) {
      if (isAdmin) { onComplete(); return }
      setStep('payment')
      return
    }

    setLoading(true)
    try {
      const res = await reservationApi.create({
        roomId:          booking.roomId,
        timeSlotId:      booking.timeSlotId,
        reservationDate: booking.date,
        peopleCount:     people,
        notes:           notes || undefined,
      })
      setReservation(res.data.data)
      if (isAdmin) {
        toast.success('Бронь создана')
        onComplete()
        return
      }
      setStep('payment')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Не удалось забронировать. Попробуйте ещё раз.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'payment' && reservation) {
    return (
      <PaymentModal
        reservation={reservation}
        sessionPrice={sessionPrice}
        onClose={onClose}
        onBack={() => setStep('details')}
        onComplete={onComplete}
      />
    )
  }

  const totalPrice = (people === 2) ? 8000 : sessionPrice * people;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header — room identity */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${meta.accent}22`,
                border: `1px solid ${meta.accent}`,
                boxShadow: `0 0 20px ${meta.accent}33`,
              }}
            >
              <Icon className="w-6 h-6" style={{ color: meta.accent }} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-red-800 tracking-[0.2em] uppercase mb-0.5">
                Бронирование
              </p>
              <h2 className="font-display text-base text-bone tracking-wider truncate">
                {booking.roomName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-bone-dark/60 hover:text-crimson transition-colors p-1 -m-1"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 font-mono text-[10px] tracking-widest">
          <span className="flex items-center gap-1.5 text-crimson">
            <span className="w-4 h-4 rounded-full border border-crimson bg-crimson/20 flex items-center justify-center text-[9px] font-bold">1</span>
            ДЕТАЛИ
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-crimson/40 to-white/10" />
          <span className={`flex items-center gap-1.5 ${isAdmin ? 'text-bone-dark/30' : 'text-bone-dark/50'}`}>
            <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-bold">2</span>
            {isAdmin ? 'ГОТОВО' : 'ОПЛАТА'}
          </span>
        </div>

        {/* Slot info chips */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <InfoChip icon={<Calendar className="w-3.5 h-3.5" />} label="ДАТА" value={formatDate(booking.date)} />
          <InfoChip icon={<Clock className="w-3.5 h-3.5" />} label="ВРЕМЯ" value={`${booking.startTime}–${booking.endTime}`} />
          <InfoChip icon={<Users className="w-3.5 h-3.5" />} label="ВМЕСТ." value={`${booking.capacity}`} />
        </div>

        {/* People count */}
        <div className="mb-5">
          <label className="font-mono text-[10px] text-bone-dark/80 tracking-widest block mb-2">
            УЧАСТНИКИ · <span className="text-red-700">{booking.minPeople}–{booking.capacity} чел.</span>
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-lg border border-crimson/30 bg-black/40">
            <button
              onClick={() => setPeople(p => Math.max(booking.minPeople, p - 1))}
              disabled={people <= booking.minPeople}
              className="w-11 h-11 rounded-md border border-white/10 hover:border-crimson/60 hover:bg-crimson/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 flex items-center justify-center transition-all"
              aria-label="Меньше"
            >
              <Minus className="w-4 h-4 text-bone" />
            </button>
            <div className="flex-1 text-center">
              <div className="font-display text-3xl text-white text-glow-subtle leading-none">
                {people}
              </div>
              <div className="font-mono text-[9px] text-bone-dark/50 tracking-widest mt-1">
                {people === 1 ? 'ЧЕЛОВЕК' : people < 5 ? 'ЧЕЛОВЕКА' : 'ЧЕЛОВЕК'}
              </div>
            </div>
            <button
              onClick={() => setPeople(p => Math.min(booking.capacity, p + 1))}
              disabled={people >= booking.capacity}
              className="w-11 h-11 rounded-md border border-white/10 hover:border-crimson/60 hover:bg-crimson/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10 flex items-center justify-center transition-all"
              aria-label="Больше"
            >
              <Plus className="w-4 h-4 text-bone" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="font-mono text-[10px] text-bone-dark/80 tracking-widest block mb-2">
            ПОЖЕЛАНИЯ <span className="text-red-900/60">(необязательно)</span>
          </label>
          <textarea
            className="horror-input resize-none h-16 text-sm"
            placeholder="День рождения, особые пожелания..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Pricing */}
        {isAdmin ? (
          <div className="border border-green-900/30 bg-green-950/15 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="font-body text-xs text-green-400/90">
              Администраторская бронь — оплата не требуется.
            </p>
          </div>
        ) : (
          <div className="border border-crimson/25 bg-gradient-to-br from-red-950/20 to-purple/20 rounded-lg px-4 py-3 mb-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-mono text-[10px] text-red-800 tracking-widest mb-0.5">ИТОГО К ОПЛАТЕ</p>
              </div>
              <div className="font-display text-2xl text-white text-glow-subtle">
                {totalPrice.toLocaleString()} ₸
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Отмена</button>
          <button
            onClick={handleReserve}
            disabled={loading}
            className="btn-blood flex-[1.4] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">ОБРАБОТКА...</span>
            ) : (
              <>{isAdmin ? 'СОЗДАТЬ БРОНЬ' : 'ДАЛЕЕ'} <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-black/40 rounded-lg px-2 py-2 text-center">
      <div className="flex items-center justify-center text-crimson/80 mb-1">{icon}</div>
      <p className="font-mono text-[8px] text-bone-dark/60 tracking-widest mb-0.5">{label}</p>
      <p className="font-body text-[11px] text-bone leading-tight truncate">{value}</p>
    </div>
  )
}

/** Convert ISO date → "12 апр" label for compact display. */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00')
    const day = d.getDate()
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    return `${day} ${months[d.getMonth()]}`
  } catch {
    return iso
  }
}

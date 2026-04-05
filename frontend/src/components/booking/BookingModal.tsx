'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { reservationApi } from '@/lib/api'
import type { BookingState, Reservation } from '@/types'
import PaymentModal from './PaymentModal'
import { useAuthStore } from '@/lib/store'
import { X, Users, Clock, Calendar, ChevronRight } from 'lucide-react'

interface Props {
  booking: BookingState
  onClose: () => void
  onComplete: () => void
}

const THEME_ICONS: Record<string, string> = { LIVING: '🩸', PASSENGER: '🚂', DEAD: '💀' }

export default function BookingModal({ booking, onClose, onComplete }: Props) {
  const { isAdmin } = useAuthStore()
  const [step, setStep]             = useState<'details' | 'payment'>('details')
  const [people, setPeople]         = useState(booking.minPeople)
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)

  const handleReserve = async () => {
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
        toast.success('Reservation created!')
        onComplete()
        return
      }
      setStep('payment')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'payment' && reservation) {
    return (
      <PaymentModal
        reservation={reservation}
        onClose={onClose}
        onComplete={onComplete}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{THEME_ICONS[booking.themeCode]}</span>
              <h2 className="font-display text-sm text-bone tracking-wider">
                {booking.roomName}
              </h2>
            </div>
            <p className="font-mono text-xs text-red-800 tracking-widest">RESERVE YOUR SLOT</p>
          </div>
          <button onClick={onClose} className="text-red-900 hover:text-red-500 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot info — stacks on very small screens */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <InfoChip icon={<Calendar className="w-3.5 h-3.5" />} label="DATE" value={booking.date} />
          <InfoChip icon={<Clock className="w-3.5 h-3.5" />} label="TIME" value={`${booking.startTime}–${booking.endTime}`} />
          <InfoChip icon={<Users className="w-3.5 h-3.5" />} label="PLACES" value={`max ${booking.capacity}`} />
        </div>

        {/* People count */}
        <div className="mb-5">
          <label className="font-mono text-xs text-red-800 tracking-widest block mb-2">
            NUMBER OF SURVIVORS
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPeople(p => Math.max(booking.minPeople, p - 1))}
              className="btn-ghost py-2 px-4 text-lg leading-none"
              disabled={people <= booking.minPeople}
            >−</button>
            <div className="flex-1 text-center font-display text-2xl text-blood-light text-glow-subtle">
              {people}
            </div>
            <button
              onClick={() => setPeople(p => Math.min(booking.capacity, p + 1))}
              className="btn-ghost py-2 px-4 text-lg leading-none"
              disabled={people >= booking.capacity}
            >+</button>
          </div>
          <p className="font-mono text-xs text-red-900/60 text-center mt-2">
            Min {booking.minPeople} · Max {booking.capacity}
          </p>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="font-mono text-xs text-red-800 tracking-widest block mb-2">
            SPECIAL NOTES (OPTIONAL)
          </label>
          <textarea
            className="horror-input resize-none h-16 text-sm"
            placeholder="Any special requirements..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Pricing hint */}
        {isAdmin ? (
          <div className="border border-green-900/20 bg-green-950/10 px-3 py-2 mb-6 font-mono text-xs text-green-700/80">
            <p>Admin booking — no payment required.</p>
          </div>
        ) : (
          <div className="border border-red-900/20 bg-red-950/10 px-3 py-2 mb-6 font-mono text-xs text-red-800/80">
            <p>Payment via Kaspi Pay will be required after confirmation.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleReserve}
            disabled={loading}
            className="btn-blood flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-red-900/20 bg-void-surface px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-red-800 mb-1">{icon}</div>
      <p className="font-mono text-[9px] text-red-900/60 tracking-widest mb-0.5">{label}</p>
      <p className="font-body text-xs text-bone leading-tight">{value}</p>
    </div>
  )
}

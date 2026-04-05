'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { paymentApi } from '@/lib/api'
import type { Reservation } from '@/types'
import { X, CheckCircle, XCircle, Smartphone } from 'lucide-react'

interface Props {
  reservation: Reservation
  onClose: () => void
  onComplete: () => void
}

const PRICES: Record<string, number> = { LIVING: 5000, PASSENGER: 4000, DEAD: 4500 }

export default function PaymentModal({ reservation, onClose, onComplete }: Props) {
  const [phone, setPhone]     = useState('+7')
  const [method, setMethod]   = useState<'KASPI_QR' | 'KASPI_PAY'>('KASPI_PAY')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<'success' | 'failed' | null>(null)
  const [txId, setTxId]       = useState<string>('')

  // Derive room theme for price calculation (we use peopleCount × price/person)
  // Amount is computed server-side; show estimate here
  const pricePerPerson = 4500 // fallback; server calculates exact
  const estimatedTotal = reservation.peopleCount * pricePerPerson

  const handlePay = async () => {
    if (!/^\+7[0-9]{10}$/.test(phone)) {
      toast.error('Enter a valid Kazakh phone: +7XXXXXXXXXX')
      return
    }
    setLoading(true)
    try {
      const res = await paymentApi.processKaspi({
        reservationId: reservation.id,
        phoneNumber:   phone,
        paymentMethod: method,
      })
      setTxId(res.data.data.transactionId || '')
      setResult('success')
      toast.success('Payment confirmed!')
    } catch (err: any) {
      setResult('failed')
      const msg = err.response?.data?.message || 'Payment failed. Try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ──────────────────────────────────── */
  if (result === 'success') {
    return (
      <div className="modal-overlay">
        <div className="modal-box text-center animate-slide-up">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-sm text-bone tracking-wider mb-2">
            BOOKING CONFIRMED
          </h2>
          <p className="font-body text-bone-dark mb-1">
            {reservation.roomName}
          </p>
          <p className="font-mono text-xs text-red-800 mb-4">
            {reservation.reservationDate} · {reservation.startTime}–{reservation.endTime}
          </p>
          {txId && (
            <p className="font-mono text-xs text-red-900/60 mb-6 break-all">
              TX: {txId}
            </p>
          )}
          <div className="border border-green-900/30 bg-green-950/20 px-4 py-3 mb-6 text-xs font-mono text-green-500/80">
            You will receive a confirmation on your phone. Arrive 10 minutes early.
          </div>
          <button onClick={onComplete} className="btn-blood w-full">
            BACK TO SCHEDULE
          </button>
        </div>
      </div>
    )
  }

  /* ── Failed screen ───────────────────────────────────── */
  if (result === 'failed') {
    return (
      <div className="modal-overlay">
        <div className="modal-box text-center animate-slide-up">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="font-display text-sm text-bone tracking-wider mb-2">
            PAYMENT FAILED
          </h2>
          <p className="font-body text-bone-dark mb-6">
            Your reservation is held for 15 minutes. Please try again.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={() => setResult(null)} className="btn-blood flex-1">Try Again</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Payment form ────────────────────────────────────── */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-sm text-bone tracking-wider mb-1">KASPI PAYMENT</h2>
            <p className="font-mono text-xs text-red-800 tracking-widest">SECURE CHECKOUT</p>
          </div>
          <button onClick={onClose} className="text-red-900 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order summary */}
        <div className="border border-red-900/20 bg-red-950/10 p-4 mb-6 space-y-1.5">
          <Row label="Room" value={reservation.roomName} />
          <Row label="Date" value={reservation.reservationDate} />
          <Row label="Time" value={`${reservation.startTime} – ${reservation.endTime}`} />
          <Row label="People" value={String(reservation.peopleCount)} />
          <div className="border-t border-red-900/20 pt-2 mt-2 flex justify-between items-center">
            <span className="font-mono text-xs text-red-800 tracking-widest">TOTAL</span>
            <span className="font-display text-base text-blood-light text-glow-subtle">
              ≈ {(reservation.peopleCount * 4500).toLocaleString()} KZT
            </span>
          </div>
        </div>

        {/* Method selector */}
        <div className="mb-5">
          <label className="font-mono text-xs text-red-800 tracking-widest block mb-2">
            PAYMENT METHOD
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['KASPI_PAY', 'KASPI_QR'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`py-2.5 px-3 border font-mono text-xs tracking-wider transition-all ${
                  method === m
                    ? 'border-red-700 bg-red-950/40 text-red-300'
                    : 'border-red-900/20 text-red-900 hover:border-red-800/40'
                }`}
              >
                {m === 'KASPI_PAY' ? '📱 Kaspi Pay' : '📷 Kaspi QR'}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="font-mono text-xs text-red-800 tracking-widest block mb-2">
            KASPI PHONE NUMBER
          </label>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-red-800 flex-shrink-0" />
            <input
              type="tel"
              className="horror-input font-mono"
              placeholder="+7XXXXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={12}
            />
          </div>
          <p className="font-mono text-xs text-red-900/50 mt-1.5 ml-6">
            Format: +7XXXXXXXXXX
          </p>
        </div>

        {/* Kaspi mock notice */}
        <div className="border border-amber-900/20 bg-amber-950/10 px-3 py-2 mb-6 font-mono text-xs text-amber-700/80">
          ⚠ Mock integration active. In production, Kaspi will send a push notification.
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Back</button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="btn-blood flex-1"
          >
            {loading ? <span className="animate-pulse">Processing...</span> : 'PAY NOW'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-mono text-xs text-red-900/70 tracking-wider">{label}</span>
      <span className="font-body text-sm text-bone">{value}</span>
    </div>
  )
}

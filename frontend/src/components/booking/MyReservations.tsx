'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { reservationApi } from '@/lib/api'
import type { Reservation } from '@/types'
import { X, CheckCircle, Clock, XCircle, Trash2, CreditCard } from 'lucide-react'
import clsx from 'clsx'
import PaymentModal from './PaymentModal'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'text-green-400 border-green-800/30 bg-green-950/20',
  PENDING:   'text-amber-400 border-amber-800/30 bg-amber-950/20',
  CANCELLED: 'text-red-700  border-red-900/30   bg-red-950/20 opacity-60',
  EXPIRED:   'text-gray-600 border-gray-800/30  bg-gray-950/20 opacity-50',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle className="w-3.5 h-3.5" />,
  PENDING:   <Clock className="w-3.5 h-3.5" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5" />,
  EXPIRED:   <XCircle className="w-3.5 h-3.5" />,
}

interface Props {
  /** When true, renders inline (no modal overlay). When false/absent, renders as modal. */
  inline?: boolean
  sessionPrice?: number
  onClose?: () => void
}

export default function MyReservations({ inline = false, sessionPrice = 3500, onClose }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [cancelling, setCancelling]     = useState<number | null>(null)
  const [payingReservation, setPayingReservation] = useState<Reservation | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await reservationApi.getMyReservations()
      setReservations(res.data.data)
    } catch {
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Silent background poll: fetch reservations every 8s, update state ONLY if a
  // status or payment status changed. Returning the same reference prevents re-render.
  useEffect(() => {
    if (!inline) return

    const signature = (rs: Reservation[]) =>
      rs.map(r => `${r.id}:${r.status}:${r.payment?.status ?? ''}`).join(',')

    const poll = async () => {
      try {
        const res = await reservationApi.getMyReservations()
        const incoming = res.data.data
        setReservations(current =>
          signature(current) === signature(incoming) ? current : incoming
        )
      } catch {
        // silent
      }
    }

    const id = setInterval(poll, 8_000)
    return () => clearInterval(id)
  }, [inline])

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this reservation?')) return
    setCancelling(id)
    try {
      await reservationApi.cancel(id)
      toast.success('Reservation cancelled')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancelling(null)
    }
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display text-xs text-bone tracking-wider">МОИ БРОНИ</h2>
          <p className="font-mono text-[10px] text-red-900 tracking-widest mt-0.5">ЗАПЛАНИРОВАННЫЕ КОШМАРЫ</p>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} className="text-red-900 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={clsx('space-y-2', inline ? '' : 'overflow-y-auto flex-1 pr-1')}>
        {loading ? (
          <p className="font-mono text-xs text-red-900 text-center py-6 animate-pulse tracking-widest">
            ЗАГРУЗКА...
          </p>
        ) : reservations.length === 0 ? (
          <div className="text-center py-6">
            <p className="font-mono text-xs text-red-900/50 tracking-widest">НЕТ БРОНЕЙ</p>
            <p className="font-body text-bone-dark/50 text-sm mt-1">Выбери сеанс ниже.</p>
          </div>
        ) : (
          reservations.map(r => (
            <div
              key={r.id}
              className={clsx(
                'border px-3 py-2.5 transition-all',
                STATUS_STYLES[r.status] || 'border-red-900/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display text-xs text-bone tracking-wide">{r.roomName}</p>
                    <span className={clsx(
                      'flex items-center gap-1 font-mono text-[9px] tracking-widest px-1.5 py-0.5 border rounded-sm',
                      STATUS_STYLES[r.status]
                    )}>
                      {STATUS_ICONS[r.status]}
                      {r.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-red-800/80 mt-0.5">
                    {r.reservationDate} · {r.startTime}–{r.endTime}
                  </p>
                  <p className="font-mono text-[10px] text-red-900/50 mt-0.5">
                    {r.peopleCount} чел. · #{r.id}
                  </p>
                  {r.payment?.amount && (
                    <p className="font-mono text-[10px] text-red-800/60 mt-0.5">
                      {r.payment.status === 'SUCCESS'
                        ? `✓ Оплачено ${Number(r.payment.amount).toLocaleString()} KZT`
                        : `Оплата: ${r.payment.status}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status === 'PENDING' && (
                    <button
                      onClick={() => setPayingReservation(r)}
                      className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase px-2 py-1 border border-amber-700/50 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40 hover:border-amber-600 transition-all"
                      style={{ minHeight: 32 }}
                      title="Продолжить оплату"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span className="hidden xs:inline">Оплатить</span>
                    </button>
                  )}
                  {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelling === r.id}
                      className="text-red-800 hover:text-red-500 transition-colors"
                      style={{ minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Отменить бронь"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  if (inline) {
    return (
      <>
        <section
          className="max-w-7xl mx-auto px-3 sm:px-4 w-full py-4"
          style={{ borderBottom: '1px solid rgba(139,0,0,0.2)' }}
        >
          {content}
        </section>
        {payingReservation && (
          <PaymentModal
            reservation={payingReservation}
            sessionPrice={sessionPrice}
            onClose={() => setPayingReservation(null)}
            onBack={() => setPayingReservation(null)}
            onComplete={() => { setPayingReservation(null); load() }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-box max-w-lg w-full flex flex-col"
          style={{ maxHeight: 'min(80vh, 92dvh)' }}
          onClick={e => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
      {payingReservation && (
        <PaymentModal
          reservation={payingReservation}
          onClose={() => setPayingReservation(null)}
          onBack={() => setPayingReservation(null)}
          onComplete={() => { setPayingReservation(null); load() }}
        />
      )}
    </>
  )
}

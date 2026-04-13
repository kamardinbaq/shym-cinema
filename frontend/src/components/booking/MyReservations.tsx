'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { reservationApi } from '@/lib/api'
import type { Reservation } from '@/types'
import {
  X, CheckCircle, Clock, XCircle, Trash2, CreditCard,
  Calendar, Users, ChevronDown, ChevronUp, Ticket,
} from 'lucide-react'
import clsx from 'clsx'
import PaymentModal from './PaymentModal'

const PENDING_MINUTES = 15

/** Countdown timer: MM:SS remaining before a PENDING reservation expires. */
function PendingTimer({ createdAt }: { createdAt: string }) {
  const getSecsLeft = () => {
    const created = new Date(createdAt.includes('Z') ? createdAt : createdAt + 'Z').getTime()
    return Math.max(0, Math.floor((created + PENDING_MINUTES * 60 * 1000 - Date.now()) / 1000))

    
  }

  const [secs, setSecs] = useState(getSecsLeft)

  useEffect(() => {
    if (secs === 0) return
    const id = setInterval(() => setSecs(getSecsLeft()), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const urgent = secs < 120

  if (secs === 0) return (
    <span className="font-mono text-[10px] text-red-500">истекает...</span>
  )

  return (
    <span className={`font-mono text-[10px] ${urgent ? 'text-red-400 animate-pulse' : 'text-amber-400/80'}`}>
      ⏱ {mm}:{ss}
    </span>
  )
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: typeof CheckCircle }> = {
  CONFIRMED: { label: 'Подтверждена', cls: 'text-green-400 border-green-700/40 bg-green-950/25', Icon: CheckCircle },
  PENDING:   { label: 'Ожидает оплаты', cls: 'text-amber-400 border-amber-700/40 bg-amber-950/25', Icon: Clock },
  CANCELLED: { label: 'Отменена', cls: 'text-red-600 border-red-900/40 bg-red-950/25 opacity-60', Icon: XCircle },
  EXPIRED:   { label: 'Истекла', cls: 'text-gray-500 border-gray-800/40 bg-gray-950/25 opacity-50', Icon: XCircle },
}

interface Props {
  inline?: boolean
  sessionPrice?: number
  onClose?: () => void
}

export default function MyReservations({ inline = false, sessionPrice = 3500, onClose }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [cancelling, setCancelling]     = useState<number | null>(null)
  const [payingReservation, setPayingReservation] = useState<Reservation | null>(null)
  const [expanded, setExpanded]         = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await reservationApi.getMyReservations()
      setReservations(res.data.data)
    } catch {
      toast.error('Не удалось загрузить брони')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Silent background poll
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
    if (!confirm('Отменить эту бронь?')) return
    setCancelling(id)
    try {
      await reservationApi.cancel(id)
      toast.success('Бронь отменена')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Не удалось отменить')
    } finally {
      setCancelling(null)
    }
  }

  // Sort active first
  const activeCount = reservations.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED').length

  const header = (
    <div className="flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/40 flex items-center justify-center flex-shrink-0">
          <Ticket className="w-4 h-4 text-crimson" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xs sm:text-sm text-bone tracking-wider">МОИ БРОНИ</h2>
          <p className="font-mono text-[10px] text-red-800 tracking-widest mt-0.5">
            {activeCount > 0 ? `${activeCount} активных` : 'нет активных броней'}
          </p>
        </div>
      </div>

      {inline ? (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase text-bone-dark/70 hover:text-bone border border-white/10 hover:border-crimson/40 px-2.5 py-1.5 rounded-md transition-all"
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          {expanded ? <><ChevronUp className="w-3 h-3" />Свернуть</> : <><ChevronDown className="w-3 h-3" />Показать</>}
        </button>
      ) : (
        onClose && (
          <button onClick={onClose} className="text-bone-dark/60 hover:text-crimson transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        )
      )}
    </div>
  )

  const list = (
    <div className={clsx('space-y-2 mt-3', inline ? '' : 'overflow-y-auto flex-1 pr-1')}>
      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
          <p className="font-mono text-xs text-bone-dark/50 tracking-widest">ПОКА НЕТ БРОНЕЙ</p>
          <p className="font-body text-bone-dark/40 text-sm mt-1">Выбери сеанс ниже ↓</p>
        </div>
      ) : (
        reservations.map(r => {
          const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.CONFIRMED
          const StatusIcon = cfg.Icon
          return (
            <div
              key={r.id}
              className={clsx(
                'border rounded-lg px-3 py-2.5 transition-all flex items-start gap-3',
                cfg.cls
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-xs text-bone tracking-wide truncate">{r.roomName}</p>
                  <span className={clsx(
                    'flex items-center gap-1 font-mono text-[9px] tracking-widest px-1.5 py-0.5 border rounded',
                    cfg.cls
                  )}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-bone-dark/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {r.reservationDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {r.startTime}–{r.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {r.peopleCount}
                  </span>
                  <span className="text-bone-dark/40">#{r.id}</span>
                </div>
                {r.status === 'PENDING' && (
                  <div className="mt-1 flex items-center gap-2">
                    <PendingTimer createdAt={r.createdAt} />
                    {r.confirmationCode && (
                      <span className="font-mono text-[10px] text-amber-400/80 tracking-widest">
                        · код: <strong>{r.confirmationCode}</strong>
                      </span>
                    )}
                  </div>
                )}
                {r.payment?.amount && (
                  <p className="font-mono text-[10px] text-green-500/70 mt-1">
                    {r.payment.status === 'SUCCESS'
                      ? `✓ Оплачено ${Number(r.payment.amount).toLocaleString()} ₸`
                      : `Оплата: ${r.payment.status}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {r.status === 'PENDING' && (
                  <button
                    onClick={() => setPayingReservation(r)}
                    className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase px-2 py-1.5 border border-amber-600/50 bg-amber-950/25 text-amber-300 hover:bg-amber-950/50 hover:border-amber-500 transition-all rounded"
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
                    className="text-bone-dark/50 hover:text-red-500 hover:bg-red-950/30 rounded transition-all flex items-center justify-center"
                    style={{ minWidth: 32, minHeight: 32 }}
                    title="Отменить бронь"
                    aria-label="Отменить бронь"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  if (inline) {
    // Only render if user has reservations OR is loading (avoid empty strip)
    if (!loading && reservations.length === 0) return null
    return (
      <>
        <section className="max-w-7xl mx-auto px-3 sm:px-5 w-full py-4 border-b border-red-900/20">
          {header}
          {expanded && list}
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
          {header}
          {list}
        </div>
      </div>
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

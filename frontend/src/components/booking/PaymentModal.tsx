'use client'
import { useState } from 'react'
import type { Reservation } from '@/types'
import { X, CheckCircle, ExternalLink, MessageCircle } from 'lucide-react'

interface Props {
  reservation: Reservation
  sessionPrice: number
  onClose: () => void
  onBack: () => void
  onComplete: () => void
}

const WHATSAPP_NUMBER = '77066302270'

export default function PaymentModal({ reservation, sessionPrice, onClose, onBack, onComplete }: Props) {
  const [paid, setPaid] = useState(false)

  const whatsappText = encodeURIComponent(
    `Оплата брони #${reservation.id}\n${reservation.roomName}\n${reservation.reservationDate} ${reservation.startTime}–${reservation.endTime}\n${sessionPrice} ₸`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`

  /* ── Success screen ──────────────────────────────────── */
  if (paid) {
    return (
      <div className="modal-overlay">
        <div className="modal-box text-center animate-slide-up">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-sm text-bone tracking-wider mb-2">
            BOOKING PENDING
          </h2>
          <p className="font-body text-bone-dark mb-1">{reservation.roomName}</p>
          <p className="font-mono text-xs text-red-800 mb-4">
            {reservation.reservationDate} · {reservation.startTime}–{reservation.endTime}
          </p>
          <div className="border border-amber-900/30 bg-amber-950/10 px-4 py-3 mb-4 text-xs font-mono text-amber-600/90 text-left space-y-1">
            <p>После оплаты обязательно отправьте чек на WhatsApp:</p>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-blood w-full mb-3 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Отправить чек в WhatsApp
          </a>
          <p className="font-mono text-[10px] text-red-900/50 mb-4">
            Ваша бронь будет подтверждена после проверки оплаты администратором.
          </p>
          <button onClick={onComplete} className="btn-ghost w-full text-xs">
            Вернуться к расписанию
          </button>
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
            <h2 className="font-display text-sm text-bone tracking-wider mb-1">KASPI ОПЛАТА</h2>
            <p className="font-mono text-xs text-red-800 tracking-widest">ОПЛАТА СЕАНСА</p>
          </div>
          <button onClick={onClose} className="text-red-900 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order summary */}
        <div className="border border-red-900/20 bg-red-950/10 p-4 mb-6 space-y-1.5">
          <Row label="Комната"  value={reservation.roomName} />
          <Row label="Дата"     value={reservation.reservationDate} />
          <Row label="Время"    value={`${reservation.startTime} – ${reservation.endTime}`} />
          <Row label="Гостей"   value={String(reservation.peopleCount)} />
          <div className="border-t border-red-900/20 pt-2 mt-2 flex justify-between items-center">
            <span className="font-mono text-xs text-red-800 tracking-widest">ИТОГО</span>
            <span className="font-display text-base text-blood-light text-glow-subtle">
              {sessionPrice.toLocaleString()} ₸
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="border border-red-900/20 bg-void-surface px-4 py-3 mb-6 space-y-3 font-mono text-xs">
          <p className="text-bone-dark">
            <span className="text-red-700 mr-2">1.</span>
            Нажмите кнопку ниже и оплатите <strong className="text-bone">{sessionPrice} ₸</strong> через Kaspi.
          </p>
          <p className="text-bone-dark">
            <span className="text-red-700 mr-2">2.</span>
            После оплаты нажмите «Оплатил» и отправьте чек нам в WhatsApp.
          </p>
          <p className="text-bone-dark">
            <span className="text-red-700 mr-2">3.</span>
            Администратор подтвердит бронь после проверки чека.
          </p>
        </div>

        {/* Kaspi pay link */}
        <a
          href={`https://kaspi.kz/pay`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-blood w-full mb-3 flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Оплатить через Kaspi
        </a>

        <div className="flex gap-3">
          <button onClick={onBack} className="btn-ghost flex-1">Назад</button>
          <button onClick={() => setPaid(true)} className="btn-ghost flex-1 border-green-900/40 text-green-600 hover:border-green-700/60">
            Оплатил ✓
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

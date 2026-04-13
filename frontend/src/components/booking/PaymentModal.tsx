'use client'
import { useState } from 'react'
import type { Reservation } from '@/types'
import { X, CheckCircle, ExternalLink, Send, CreditCard, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  reservation: Reservation
  sessionPrice: number
  onClose: () => void
  onBack: () => void
  onComplete: () => void
}

const TELEGRAM_BOT = 'DarkCinemaChequeBot'
const KASPI_URL = 'https://pay.kaspi.kz/pay/xyv7zqeg'

export default function PaymentModal({ reservation, sessionPrice, onClose, onBack, onComplete }: Props) {
  const [paid, setPaid] = useState(false)

  const telegramLink = `https://t.me/${TELEGRAM_BOT}`

  const confirmCode = reservation.confirmationCode ?? String(reservation.id)

  const copyBookingCode = () => {
    navigator.clipboard.writeText(confirmCode).then(
      () => toast.success('Код брони скопирован'),
      () => toast.error('Не удалось скопировать')
    )
  }

  /* ── Success screen ──────────────────────────────────── */
  if (paid) {
    return (
      <div className="modal-overlay">
        <div className="modal-box text-center">
          <div className="w-16 h-16 rounded-full bg-green-950/40 border border-green-600/50 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <CheckCircle className="w-9 h-9 text-green-400" />
          </div>
          <h2 className="font-display text-base text-bone tracking-wider mb-2">
            ПОДТВЕРДИТЕ ОПЛАТУ
          </h2>
          <p className="font-body text-sm text-bone-dark mb-1">{reservation.roomName}</p>
          <p className="font-mono text-[11px] text-red-800 mb-5 tracking-wider">
            {reservation.reservationDate} · {reservation.startTime}–{reservation.endTime}
          </p>

          {/* Booking ID — big & copyable */}
          <button
            onClick={copyBookingCode}
            className="w-full border border-crimson/40 bg-gradient-to-br from-red-950/25 to-purple/20 px-4 py-3 mb-5 rounded-lg group hover:border-crimson/70 transition-colors"
            title="Нажмите чтобы скопировать"
          >
            <p className="font-mono text-[10px] text-red-800 tracking-widest mb-1 flex items-center justify-center gap-1">
              КОД ПОДТВЕРЖДЕНИЯ БРОНИ<br />
              нажмите чтобы скопировать*
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </p>
            <p className="font-display text-3xl text-white text-glow-subtle tracking-widest">
              {confirmCode}
            </p>
          </button>

          {/* Steps to confirm */}
          <div className="border border-amber-800/30 bg-amber-950/15 rounded-lg px-4 py-3 mb-5 text-left space-y-2">
            <p className="font-mono text-[10px] text-amber-500/80 tracking-widest mb-2 flex items-center gap-1.5">
              КАК ПОДТВЕРДИТЬ БРОНЬ
            </p>
            <Step n="1" text="Откройте Telegram-бот по кнопке ниже" />
            <Step n="2" text={`Напишите боту ваш код: ${confirmCode}`} />
            <Step n="3" text="В Kaspi найдите оплату Dark Cinema → «Поделиться»" />
            <Step n="4" text="Выберите бота — он получит чек и подтвердит бронь ✓" />
          </div>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-blood w-full mb-3 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Открыть Telegram-бот
          </a>
          <p className="font-mono text-[10px] text-bone-dark/40 mb-4 tracking-wider">
            @{TELEGRAM_BOT} — проверка и подтверждение автоматически
          </p>
          <button onClick={onComplete} className="btn-ghost w-full text-xs">
            К расписанию
          </button>
        </div>
      </div>
    )
  }

  /* ── Payment form ────────────────────────────────────── */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-crimson/15 border border-crimson/60 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-crimson" />
            </div>
            <div>
              <h2 className="font-display text-base text-bone tracking-wider">ОПЛАТА KASPI</h2>
              <p className="font-mono text-[10px] text-red-800 tracking-widest mt-0.5">
                ПОДТВЕРДИТЕ БРОНЬ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-bone-dark/60 hover:text-crimson transition-colors p-1"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 font-mono text-[10px] tracking-widest">
          <span className="flex items-center gap-1.5 text-bone-dark/50">
            <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-bold">1</span>
            ДЕТАЛИ
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-crimson/40" />
          <span className="flex items-center gap-1.5 text-crimson">
            <span className="w-4 h-4 rounded-full border border-crimson bg-crimson/20 flex items-center justify-center text-[9px] font-bold">2</span>
            ОПЛАТА
          </span>
        </div>

        {/* Order summary */}
        <div className="border border-crimson/30 bg-gradient-to-br from-red-950/20 to-purple/15 rounded-lg p-4 mb-5 space-y-1.5">
          <Row label="Комната"  value={reservation.roomName} />
          <Row label="Дата"     value={reservation.reservationDate} />
          <Row label="Время"    value={`${reservation.startTime} – ${reservation.endTime}`} />
          <Row label="Гостей"   value={String(reservation.peopleCount)} />
          <Row label="Бронь №"  value={`#${reservation.id}`} />
          <div className="border-t border-crimson/20 pt-2.5 mt-2 flex justify-between items-center">
            <span className="font-mono text-[10px] text-red-800 tracking-widest">ИТОГО</span>
            <span className="font-display text-xl text-white text-glow-subtle">
              {sessionPrice.toLocaleString()} ₸
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="border border-white/8 bg-black/40 rounded-lg px-4 py-3 mb-5 space-y-2.5 font-body text-xs">
          <InstructionStep n="1" text={<>Нажмите <strong className="text-bone">«Оплатить через Kaspi»</strong> и оплатите <strong className="text-crimson">{sessionPrice} ₸</strong></>} />
          <InstructionStep n="2" text={<>Нажмите <strong className="text-bone">«Я оплатил»</strong> — получите номер брони</>} />
          <InstructionStep n="3" text={<>Напишите боту <strong className="text-bone">@{TELEGRAM_BOT}</strong> ваш код подтверждения</>} />
          <InstructionStep n="4" text={<>В Kaspi → оплата Dark Cinema → <strong className="text-bone">«Поделиться»</strong> → бот. Готово!</>} />
        </div>

        {/* Kaspi pay link */}
        <a
          href={KASPI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-blood w-full mb-3 flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Оплатить через Kaspi
        </a>

        <div className="flex gap-3">
          <button onClick={onBack} className="btn-ghost flex-1">Назад</button>
          <button
            onClick={() => setPaid(true)}
            className="btn-ghost flex-1 border-green-700/50 text-green-400 hover:border-green-500 hover:bg-green-950/20"
          >
            Я оплатил ✓
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-mono text-[10px] text-red-800 tracking-wider uppercase">{label}</span>
      <span className="font-body text-sm text-bone">{value}</span>
    </div>
  )
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <p className="font-body text-xs text-bone-dark flex gap-2">
      <span className="text-amber-500/90 flex-shrink-0 font-bold">{n}.</span>
      <span>{text}</span>
    </p>
  )
}

function InstructionStep({ n, text }: { n: string; text: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-bone-dark/90">
      <span className="text-crimson flex-shrink-0 font-bold">{n}.</span>
      <span>{text}</span>
    </p>
  )
}

'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { availabilityApi, reservationApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { AvailabilityGrid, BookingState, Reservation } from '@/types'
import PaymentModal from '@/components/booking/PaymentModal'
import ReservationGrid from '@/components/booking/ReservationGrid'
import BookingModal from '@/components/booking/BookingModal'
import AuthModal from '@/components/booking/AuthModal'
import MyReservations from '@/components/booking/MyReservations'
import {
  ChevronLeft, ChevronRight, LogOut, User, Info,
  Calendar, Moon, ArrowDown,
} from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isAdmin, user, clearAuth, hydrate } = useAuthStore()
  const [grid, setGrid] = useState<AvailabilityGrid | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [booking, setBooking] = useState<BookingState | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [payingReservation, setPayingReservation] = useState<Reservation | null>(null)

  useEffect(() => { hydrate() }, [hydrate])

  // Auto-dismiss onboarding after 15s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 15000)
    return () => clearTimeout(t)
  }, [])

  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await availabilityApi.getGrid(dateStr)
      setGrid(res.data.data)
    } catch {
      toast.error('Не удалось загрузить расписание')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, refreshKey])

  useEffect(() => { fetchGrid() }, [fetchGrid])

  // Silent background poll: fetch grid every 8s, update state ONLY if a slot status changed.
  useEffect(() => {
    const gridSignature = (g: AvailabilityGrid) =>
      g.rooms.flatMap(r => r.slots.map(s => `${s.timeSlotId}:${s.status}`)).join(',')

    const poll = async () => {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const res = await availabilityApi.getGrid(dateStr)
        const incoming = res.data.data
        setGrid(current => {
          if (!current) return incoming
          return gridSignature(current) === gridSignature(incoming) ? current : incoming
        })
      } catch {
        // silent
      }
    }

    const id = setInterval(poll, 8_000)
    return () => clearInterval(id)
  }, [selectedDate])

  const handleSlotClick = (b: BookingState) => {
    if (!isAuthenticated) { setShowAuth(true); return }
    setBooking(b)
  }

  const handlePendingSlotClick = async (reservationId: number) => {
    if (!isAuthenticated) { setShowAuth(true); return }
    try {
      const res = await reservationApi.getMyReservations()
      const found = res.data.data.find(r => r.id === reservationId && r.status === 'PENDING')
      if (found) {
        setPayingReservation(found)
      } else {
        toast.error('Этот сеанс занят другим пользователем')
      }
    } catch {
      toast.error('Не удалось загрузить бронь')
    }
  }

  const handleBookingComplete = () => {
    setBooking(null)
    setRefreshKey(k => k + 1)
  }

  const dateLabel = format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })

  // Quick-date chips — next 5 days
  const quickDates = useMemo(() => {
    const today = startOfDay(new Date())
    return Array.from({ length: 5 }).map((_, i) => {
      const d = addDays(today, i)
      const isToday = i === 0
      const isTomorrow = i === 1
      const short = isToday
        ? 'СЕГОДНЯ'
        : isTomorrow
          ? 'ЗАВТРА'
          : format(d, 'EE', { locale: ru }).toUpperCase()
      return { date: d, short, num: format(d, 'd') }
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-red-900/30 pt-safe"
        style={{
          background: 'rgba(5,5,5,0.82)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group" aria-label="Dark Cinema — главная">
            <div className="relative px-3 block">
              <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700 transition-colors group-hover:bg-red-500" />
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700 transition-colors group-hover:bg-red-500" />
                ))}
              </div>
              <div className="px-3 py-1 border-2 border-red-700 bg-black mx-1 transition-colors group-hover:border-red-500">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-center">
                  {['D', 'A', 'R', 'K'].map(l => (
                    <span key={l} className="font-display text-xs tracking-widest text-[#cc0000] leading-tight">{l}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="leading-none">
              <div className="drip-text text-xl sm:text-2xl tracking-widest">CINEMA</div>
              <p className="font-mono text-[9px] sm:text-[10px] text-red-900 tracking-[0.3em] mt-0.5">ALMATY</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              href="/info"
              className="flex items-center justify-center gap-1.5 font-display text-xs tracking-wider text-bone-dark border border-white/10 hover:border-crimson/60 hover:text-bone hover:bg-crimson/10 transition-all rounded-md"
              style={{ minHeight: 44, minWidth: 44, padding: '0 12px' }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline text-xs tracking-widest uppercase">Уровни</span>
            </Link>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <a
                    href="/admin"
                    className="flex items-center justify-center font-display text-xs tracking-widest uppercase border border-red-900/50 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-950/30 transition-all px-3 rounded-md"
                    style={{ minHeight: 44 }}
                  >
                    Админ
                  </a>
                )}
                <div className="hidden sm:flex items-center gap-1.5 font-body text-xs px-2 flex-shrink-0 text-bone-dark">
                  <User className="w-3.5 h-3.5 text-red-700" />
                  <span className="max-w-[90px] truncate">{user?.username}</span>
                </div>
                <button
                  onClick={() => { clearAuth(); toast.success('Вы вышли') }}
                  className="flex items-center justify-center text-bone-dark border border-white/10 hover:border-red-600/60 hover:text-red-400 hover:bg-red-950/20 transition-all rounded-md"
                  style={{ minHeight: 44, minWidth: 44 }}
                  aria-label="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn-blood text-xs px-4 flex items-center justify-center"
                style={{ minHeight: 44 }}
              >
                Войти
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── My Reservations (inline, authenticated only) ─── */}
      {isAuthenticated && <MyReservations inline sessionPrice={grid?.sessionPrice ?? 3500} />}

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Atmospheric backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 30% 0%, rgba(139,0,0,0.35) 0%, transparent 65%),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(58,15,63,0.4) 0%, transparent 60%)
            `,
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center px-4 py-10 sm:py-14">
          <p className="font-mono text-[10px] sm:text-xs text-red-500/70 tracking-[0.4em] mb-3 animate-flicker">
            — ДОБРО ПОЖАЛОВАТЬ —
          </p>
          {/*<h1 className="drip-text text-4xl sm:text-5xl md:text-6xl tracking-[0.1em] leading-none mb-4">
            ВОЙДИ В DARK CINEMA
          </h1>*/}

          <h1 className="drip-text text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-4">
            чеLOVEку нужен <span className="text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.35)]">
              ADRENALINE
            </span>
          </h1>
          <p className="font-body text-base sm:text-lg text-bone-dark max-w-xl mx-auto leading-relaxed">
            Это не фильм. Это не игра. <span className="text-crimson">Место где страх становится реальным.</span>
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 font-mono text-[10px] sm:text-xs text-red-700/80 tracking-[0.2em]">
            <span>СЕАНСЫ ДО 2 ЧАСОВ</span>
            <span className="w-1 h-1 rounded-full bg-red-700/50" />
            <span>12+</span>
          </div>
        </div>
        {/* Scroll-down indicator */}
        <div className="relative flex justify-center pb-3">
          <ArrowDown className="w-4 h-4 text-red-800/50 animate-pulse-soft" />
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #8B0000, #dc143c, #8B0000, transparent)' }}
        />
      </section>

      {/* ── Onboarding hint ────────────────────────────────── */}
      {showHint && !loading && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-5 mt-5">
          <div className="onboarding-strip animate-slide-up p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <ol className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-body text-bone-dark">
              <li className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-crimson/20 border border-crimson/60 text-crimson font-bold flex items-center justify-center text-[10px]">1</span>
                Выбери дату
              </li>
              <ChevronRight className="w-3 h-3 text-crimson/50" />
              <li className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-crimson/20 border border-crimson/60 text-crimson font-bold flex items-center justify-center text-[10px]">2</span>
                Выбери комнату и время
              </li>
              <ChevronRight className="w-3 h-3 text-crimson/50" />
              <li className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-crimson/20 border border-crimson/60 text-crimson font-bold flex items-center justify-center text-[10px]">3</span>
                Забронируй и оплати
              </li>
            </ol>
            <button
              onClick={() => setShowHint(false)}
              className="text-bone-dark/60 hover:text-bone font-mono text-[10px] tracking-widest px-2 py-1 border border-white/10 hover:border-white/30 rounded transition-colors"
              aria-label="Скрыть подсказку"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Date Picker ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 mb-6 w-full">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-crimson" />
          <p className="font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase text-bone-dark/70">
            Выберите дату
          </p>
        </div>

        {/* Quick chips row */}
        <div className="flex items-stretch gap-2 mb-3 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
          {quickDates.map(({ date, short, num }) => {
            const active = isSameDay(date, selectedDate)
            return (
              <button
                key={short + num}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 min-w-[74px] px-3 py-2 rounded-lg border transition-all text-center ${active
                    ? 'border-crimson bg-crimson/15 shadow-[0_0_20px_rgba(220,20,60,0.25)]'
                    : 'border-white/10 hover:border-crimson/60 hover:bg-crimson/5'
                  }`}
                aria-pressed={active}
              >
                <div className={`font-mono text-[9px] tracking-widest ${active ? 'text-crimson' : 'text-bone-dark/60'}`}>
                  {short}
                </div>
                <div className={`font-display text-lg leading-none mt-1 ${active ? 'text-white text-glow-subtle' : 'text-bone-dark'}`}>
                  {num}
                </div>
              </button>
            )
          })}
        </div>

        {/* Arrow navigation */}
        <div className="flex items-center gap-2 sm:gap-3 justify-center">
          <button
            onClick={() => setSelectedDate(d => subDays(d, 1))}
            className="btn-ghost flex items-center justify-center flex-shrink-0"
            style={{ minWidth: 46, minHeight: 46, padding: '0 12px' }}
            aria-label="Предыдущий день"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="flex-1 text-center px-3 sm:px-6 py-3 border rounded-lg"
            style={{
              borderColor: 'rgba(220,20,60,0.35)',
              background: 'linear-gradient(180deg, rgba(220,20,60,0.08) 0%, rgba(58,15,63,0.08) 100%)',
              maxWidth: 360,
            }}
          >
            <p className="font-display text-xs sm:text-sm tracking-wider leading-tight text-bone">
              {dateLabel}
            </p>
          </div>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="btn-ghost flex items-center justify-center flex-shrink-0"
            style={{ minWidth: 46, minHeight: 46, padding: '0 12px' }}
            aria-label="Следующий день"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-5 pb-16 w-full">
        {loading ? (
          <GridSkeleton />
        ) : grid && grid.rooms.length > 0 ? (
          <ReservationGrid
            grid={grid}
            onSlotClick={handleSlotClick}
            onPendingSlotClick={handlePendingSlotClick}
          />
        ) : (
          <EmptyState />
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 justify-items-center mt-10 pt-6"
          style={{ borderTop: '1px solid rgba(139,0,0,0.25)' }}>
          <LegendDot color="bg-green-900/40 border-green-600/50" label="СВОБОДНО" />
          <LegendDot color="bg-amber-900/40 border-amber-600/50" label="ОЖИДАНИЕ" />
          <LegendDot color="bg-red-900/40 border-red-600/50" label="ЗАНЯТО" />
          <LegendDot color="bg-gray-900/40 border-gray-600/40 border-dashed" label="ПРОШЁЛ" />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center border-t border-red-900/25">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-70">
          <Moon className="w-3 h-3 text-red-800" />
          <p className="font-mono text-xs tracking-[0.25em] text-red-800">
            © DARK CINEMA · ALMATY
          </p>
          <Moon className="w-3 h-3 text-red-800" />
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            { name: 'Instagram', href: 'https://instagram.com/dark__cinema' },
            { name: 'WhatsApp', href: 'https://wa.me/77066302270' },
            { name: 'TikTok', href: 'https://tiktok.com/@dark_cinema_' },
            { name: '2GIS — Адрес', href: 'https://go.2gis.com/MKR9F' },
          ].map(link => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs tracking-wider px-4 py-2 rounded-md border border-white/10 text-bone-dark hover:border-crimson/60 hover:text-bone hover:bg-crimson/8 transition-all duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────── */}
      {booking && (
        <BookingModal
          booking={booking}
          sessionPrice={grid?.sessionPrice ?? 3500}
          onClose={() => setBooking(null)}
          onComplete={handleBookingComplete}
        />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
      {payingReservation && (
        <PaymentModal
          reservation={payingReservation}
          sessionPrice={grid?.sessionPrice ?? 3500}
          onClose={() => setPayingReservation(null)}
          onBack={() => setPayingReservation(null)}
          onComplete={() => { setPayingReservation(null); setRefreshKey(k => k + 1) }}
        />
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3.5 h-3.5 rounded-sm flex-shrink-0 border ${color}`} />
      <span className="font-mono text-[10px] sm:text-xs tracking-wider text-bone-dark/80">{label}</span>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map(i => (
        <div key={i} className="room-card theme-living p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton w-11 h-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {[0, 1, 2, 3, 4, 5].map(j => <div key={j} className="skeleton h-[92px]" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="drip-text text-5xl animate-pulse-soft">☠</div>
      <p className="font-display text-lg text-bone tracking-wider">НЕТ СЕАНСОВ</p>
      <p className="font-body text-bone-dark/60 max-w-sm">
        На выбранную дату сеансы не запланированы. Попробуйте другой день.
      </p>
    </div>
  )
}

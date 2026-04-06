'use client'
import { useEffect, useState, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { availabilityApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { AvailabilityGrid, BookingState } from '@/types'
import ReservationGrid from '@/components/booking/ReservationGrid'
import BookingModal from '@/components/booking/BookingModal'
import AuthModal from '@/components/booking/AuthModal'
import MyReservations from '@/components/booking/MyReservations'
import { ChevronLeft, ChevronRight, LogOut, User, Info } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isAdmin, user, clearAuth, hydrate } = useAuthStore()
  const [grid, setGrid]           = useState<AvailabilityGrid | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [booking, setBooking]     = useState<BookingState | null>(null)
  const [showAuth, setShowAuth]   = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { hydrate() }, [hydrate])

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
  // No loading spinner — the user never sees a flicker unless data actually changes.
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
        // silent — don't toast on background failures
      }
    }

    const id = setInterval(poll, 8_000)
    return () => clearInterval(id)
  }, [selectedDate])

  const handleSlotClick = (b: BookingState) => {
    if (!isAuthenticated) { setShowAuth(true); return }
    setBooking(b)
  }

  const handleBookingComplete = () => {
    setBooking(null)
    setRefreshKey(k => k + 1)
  }

  const dateLabel = format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-red-900/40"
        style={{
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(8px)',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="relative px-3 hidden xs:block">
              {/* Film strip sides */}
              <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700" />
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700" />
                ))}
              </div>
              <div className="px-3 py-1 border-2 border-red-700 bg-black mx-1">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-center">
                  <span className="font-display text-xs tracking-widest text-white leading-tight">D</span>
                  <span className="font-display text-xs tracking-widest text-white leading-tight">A</span>
                  <span className="font-display text-xs tracking-widest text-white leading-tight">R</span>
                  <span className="font-display text-xs tracking-widest text-white leading-tight">K</span>
                </div>
              </div>
            </div>
            <div className="leading-none">
              <div className="drip-text text-xl sm:text-2xl tracking-widest">CINEMA</div>
              <p className="font-mono text-[9px] sm:text-[10px] text-red-900 tracking-[0.3em] mt-0.5">ALMATY</p>
            </div>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Link href="/info"
              className="flex items-center justify-center gap-1 sm:gap-1.5 font-display text-xs tracking-wide text-bone-dark border border-bone-dark/20 hover:border-bone-dark/50 hover:text-bone hover:bg-white/4 transition-all rounded-none"
              style={{ minHeight: 44, minWidth: 44, padding: '0 10px' }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline text-xs tracking-widest uppercase">Уровни</span>
            </Link>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <a href="/admin"
                    className="flex items-center justify-center font-display text-xs tracking-widest uppercase border border-red-900/40 text-red-400 hover:border-red-600/60 hover:text-red-300 transition-all px-2.5"
                    style={{ minHeight: 44 }}
                  >
                    Админ
                  </a>
                )}
                <div className="hidden sm:flex items-center gap-1.5 text-sm font-body px-1 flex-shrink-0" style={{ color: '#c4b49a' }}>
                  <User className="w-3.5 h-3.5 text-red-700" />
                  <span className="max-w-[80px] truncate text-xs">{user?.username}</span>
                </div>
                <button
                  onClick={() => { clearAuth(); toast.success('Вы вышли') }}
                  className="flex items-center justify-center text-bone-dark border border-bone-dark/20 hover:border-red-700/40 hover:text-red-500 transition-all"
                  style={{ minHeight: 44, minWidth: 44 }}
                  aria-label="Выйти"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn-blood text-xs px-4"
                style={{ minHeight: 44 }}
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── My Reservations (inline, authenticated only) ─── */}
      {isAuthenticated && <MyReservations inline sessionPrice={grid?.sessionPrice ?? 3500} />}

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative py-6 sm:py-8 px-4 text-center">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #8B0000, transparent)' }} />
        <p className="font-body text-base sm:text-lg tracking-wide max-w-xl mx-auto leading-relaxed"
          style={{ color: '#c4b49a' }}>
          Выбери комнату. Выбери время. Попробуй выжить.
        </p>
        <p className="font-mono text-xs mt-2 tracking-[0.2em]" style={{ color: '#4a0000' }}>
          — ВСЕ СЕАНСЫ 2 ЧАСА —
        </p>
      </section>

      {/* ── Date Picker ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-6 w-full">
        <div className="flex items-center gap-2 sm:gap-4 justify-center">
          <button
            onClick={() => setSelectedDate(d => subDays(d, 1))}
            className="btn-ghost flex items-center justify-center flex-shrink-0"
            style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
            aria-label="Предыдущий день"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center px-3 sm:px-6 py-2.5 border"
            style={{ borderColor: 'rgba(139,0,0,0.4)', background: 'rgba(204,0,0,0.05)', maxWidth: 320 }}>
            <p className="font-display text-xs sm:text-sm tracking-wider leading-tight" style={{ color: '#e8dcc8' }}>{dateLabel}</p>
          </div>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="btn-ghost flex items-center justify-center flex-shrink-0"
            style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
            aria-label="Следующий день"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 pb-16 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="drip-text text-4xl animate-pulse">☠</div>
            <p className="font-mono text-sm tracking-widest animate-flicker" style={{ color: '#4a0000' }}>
              ЗАГРУЗКА...
            </p>
          </div>
        ) : grid ? (
          <ReservationGrid
            grid={grid}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <p className="text-center font-mono py-24 tracking-widest" style={{ color: '#4a0000' }}>
            НЕТ ДАННЫХ
          </p>
        )}

        {/* Legend — 2×2 on mobile, 4 in a row on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 justify-items-center mt-8 pt-6"
          style={{ borderTop: '1px solid rgba(139,0,0,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0 bg-green-950/50 border border-green-700/40" />
            <span className="font-mono text-[10px] sm:text-xs tracking-wider" style={{ color: '#c4b49a' }}>СВОБОДНО</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: 'rgba(40,35,0,0.4)', border: '1px solid rgba(200,160,0,0.45)' }} />
            <span className="font-mono text-[10px] sm:text-xs tracking-wider" style={{ color: '#c4b49a' }}>ОЖИДАНИЕ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0 bg-red-950/50 border border-red-800/40" />
            <span className="font-mono text-[10px] sm:text-xs tracking-wider" style={{ color: '#c4b49a' }}>ЗАНЯТО</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: 'rgba(20,20,20,0.3)', border: '1px solid rgba(80,80,80,0.25)' }} />
            <span className="font-mono text-[10px] sm:text-xs tracking-wider" style={{ color: '#c4b49a' }}>ПРОШЁЛ</span>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-6 px-4 text-center" style={{ borderTop: '1px solid rgba(139,0,0,0.2)' }}>
        <p className="font-mono text-xs tracking-[0.2em] mb-3" style={{ color: 'rgba(139,0,0,0.6)' }}>
          © DARK CINEMA · ALMATY
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="https://instagram.com/dark__cinema" target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider px-3 py-1.5 rounded border transition-all duration-200"
            style={{ color: '#c4b49a', borderColor: 'rgba(139,0,0,0.3)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#cc0000'; (e.target as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(139,0,0,0.3)'; (e.target as HTMLElement).style.color = '#c4b49a' }}
          >
            Instagram
          </a>
          <a href="https://wa.me/77066302270" target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider px-3 py-1.5 rounded border transition-all duration-200"
            style={{ color: '#c4b49a', borderColor: 'rgba(139,0,0,0.3)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#cc0000'; (e.target as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(139,0,0,0.3)'; (e.target as HTMLElement).style.color = '#c4b49a' }}
          >
            WhatsApp
          </a>
          <a href="https://tiktok.com/@dark__cinema" target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider px-3 py-1.5 rounded border transition-all duration-200"
            style={{ color: '#c4b49a', borderColor: 'rgba(139,0,0,0.3)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#cc0000'; (e.target as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(139,0,0,0.3)'; (e.target as HTMLElement).style.color = '#c4b49a' }}
          >
            TikTok
          </a>
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
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const levels = [
  {
    name: 'LEVEL 1',
    desc: 'обычный просмотр фильма',
    sub: '(без спецэффектов и аниматоров)',
  },
  {
    name: 'LEVEL 2',
    desc: 'фильм со спецэффектами',
    sub: '(без аниматора)',
  },
  {
    name: 'LEVEL 3',
    desc: 'фильм со спецэффектами и аниматорами',
    sub: '',
  },
  {
    name: 'LEVEL MAX',
    desc: 'фильм со спецэффектами и аниматорами',
    sub: '(бьют шокером)',
  },
]

const rules = [
  'Опоздание более 15 минут - сеанс аннулируется без возврата',
  'Алкоголь и наркотики запрещены',
  'Запрещена включать вспышку внутри залов',
  'Насилие в отношении аниматоров ЗАПРЕЩЕНО, штраф 15 000₸',
  'Участие по собственному желанию — отказ принимается'
]

function DarkCinemaLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dotSize = size === 'sm' ? 4 : 5
  const dotGap = size === 'sm' ? 4 : 5
  const letterSize = size === 'sm' ? '10px' : '13px'
  const cinemaSize = size === 'sm' ? '18px' : '22px'
  const dots = size === 'sm' ? 3 : 4

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Film strip box */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Left perforations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${dotGap}px` }}>
          {Array.from({ length: dots }).map((_, i) => (
            <div key={i} style={{ width: dotSize, height: dotSize, borderRadius: '2px', background: '#cc0000' }} />
          ))}
        </div>

        {/* DARK box */}
        <div style={{
          border: '2px solid #cc0000',
          background: '#000',
          padding: '4px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px 8px',
          textAlign: 'center',
        }}>
          {['D', 'A', 'R', 'K'].map(letter => (
            <span key={letter} style={{
              fontFamily: 'var(--font-display)',
              fontSize: letterSize,
              color: '#cc0001',
              letterSpacing: '0.05em',
              lineHeight: 1.2,
            }}>{letter}</span>
          ))}
        </div>

        {/* Right perforations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${dotGap}px` }}>
          {Array.from({ length: dots }).map((_, i) => (
            <div key={i} style={{ width: dotSize, height: dotSize, borderRadius: '2px', background: '#cc0000' }} />
          ))}
        </div>
      </div>

      {/* CINEMA drip text */}
      <span className="drip-text" style={{ fontSize: cinemaSize, letterSpacing: '0.18em' }}>CINEMA</span>
    </div>
  )
}

export default function InfoPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-red-900/30 pt-safe"
        style={{
          background: 'rgba(5,5,5,0.82)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between">

          {/* Left: Logo (ТОЧНО как в main page) */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
            <div className="relative px-3 block">
              <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700 group-hover:bg-red-500" />
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-red-700 group-hover:bg-red-500" />
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
              <p className="font-mono text-[9px] sm:text-[10px] text-red-900 tracking-[0.3em] mt-0.5">
                ALMATY
              </p>
            </div>
          </Link>

          {/* Right: Back button */}
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xs tracking-widest uppercase text-bone-dark border border-white/10 px-3 rounded-md hover:border-red-600/60 hover:text-red-400 hover:bg-red-950/20 transition-all"
            style={{ minHeight: 44 }}
          >
            <ChevronLeft size={14} />
            Назад
          </Link>

        </div>
      </header>

      {/* ── Page hero ──────────────────────────────────────── */}

      <main style={{ flex: 1, maxWidth: '640px', margin: '0 auto', padding: '40px 16px', width: '100%' }}>

        {/* ── Levels ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '48px' }}>
          <h2 className="drip-text" style={{ fontSize: '52px', textAlign: 'center', marginBottom: '28px', letterSpacing: '0.12em', display: 'block' }}>
            LEVELS
          </h2>

          <div style={{
            border: '1px solid rgba(204,0,0,0.4)',
            borderRadius: '18px',
            overflow: 'hidden',
            background: 'rgba(8,0,0,0.9)',
          }}>
            {levels.map((lvl, i) => (
              <div key={i} style={{
                padding: '22px 16px',
                textAlign: 'center',
                borderBottom: i < levels.length - 1 ? '1px solid rgba(204,0,0,0.15)' : 'none',
                background: 'transparent',
              }}>
                <p className="drip-text" style={{ fontSize: '26px', marginBottom: '8px', letterSpacing: '0.1em' }}>
                  {lvl.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#e8dcc8', lineHeight: 1.4 }}>
                  {lvl.desc}
                </p>
                {lvl.sub && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#a09080', marginTop: '2px' }}>
                    {lvl.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Rules ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '48px' }}>
          <h2 className="drip-text" style={{ fontSize: '44px', textAlign: 'center', marginBottom: '28px', letterSpacing: '0.12em', display: 'block' }}>
            ПРАВИЛА
          </h2>

          <div style={{
            border: '1px solid rgba(204,0,0,0.4)',
            borderRadius: '18px',
            overflow: 'hidden',
            background: 'rgba(8,0,0,0.9)',
          }}>
            {rules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 20px',
                borderBottom: i < rules.length - 1 ? '1px solid rgba(139,0,0,0.15)' : 'none',
              }}>
                <span className="drip-text" style={{ fontSize: '13px', marginTop: '2px', flexShrink: 0 }}>▸</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#e8dcc8', lineHeight: 1.45 }}>
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social Links ───────────────────────────────────── */}
        <section style={{ marginBottom: '48px' }}>
          <h2 className="drip-text" style={{ fontSize: '44px', textAlign: 'center', marginBottom: '28px', letterSpacing: '0.12em', display: 'block' }}>
            МЫ В СЕТЯХ
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Instagram */}
            <a
              href="https://instagram.com/dark__cinema"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                background: 'rgba(204,0,0,0.08)',
                border: '1px solid rgba(204,0,0,0.35)',
                borderRadius: '12px',
                padding: '16px 24px',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#e8dcc8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.2)'
                el.style.borderColor = '#cc0000'
                el.style.boxShadow = '0 0 20px rgba(204,0,0,0.25)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.08)'
                el.style.borderColor = 'rgba(204,0,0,0.35)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Instagram icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cc0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#cc0000" stroke="none" />
              </svg>
              <span>Instagram — @dark__cinema</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/77066302270"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                background: 'rgba(204,0,0,0.08)',
                border: '1px solid rgba(204,0,0,0.35)',
                borderRadius: '12px',
                padding: '16px 24px',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#e8dcc8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.2)'
                el.style.borderColor = '#cc0000'
                el.style.boxShadow = '0 0 20px rgba(204,0,0,0.25)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.08)'
                el.style.borderColor = 'rgba(204,0,0,0.35)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* WhatsApp icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cc0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp — написать нам</span>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@dark_cinema_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                background: 'rgba(204,0,0,0.08)',
                border: '1px solid rgba(204,0,0,0.35)',
                borderRadius: '12px',
                padding: '16px 24px',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#e8dcc8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.2)'
                el.style.borderColor = '#cc0000'
                el.style.boxShadow = '0 0 20px rgba(204,0,0,0.25)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.08)'
                el.style.borderColor = 'rgba(204,0,0,0.35)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* TikTok icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#cc0000">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
              </svg>
              <span>TikTok — @dark_cinema_</span>
            </a>

            {/* 2GIS */}
            <a
              href="https://go.2gis.com/MKR9F"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                background: 'rgba(204,0,0,0.08)',
                border: '1px solid rgba(204,0,0,0.35)',
                borderRadius: '12px',
                padding: '16px 24px',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#e8dcc8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.2)'
                el.style.borderColor = '#cc0000'
                el.style.boxShadow = '0 0 20px rgba(204,0,0,0.25)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(204,0,0,0.08)'
                el.style.borderColor = 'rgba(204,0,0,0.35)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* 2GIS map pin icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cc0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span>2GIS — Наш адрес</span>
            </a>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        padding: '16px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        textAlign: 'center',
        borderTop: '1px solid rgba(139,0,0,0.2)',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(139,0,0,0.5)' }}>
          © DARK CINEMA · ALMATY
        </p>
      </footer>
    </div>
  )
}

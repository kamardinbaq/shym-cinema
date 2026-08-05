'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { availabilityApi, settingsApi } from '@/lib/api'
import type { AvailabilityGrid, Language, SiteSettings } from '@/types'
import ReservationGrid from '@/components/ReservationGrid'
import Reviews from '@/components/Reviews'
import {
  ChevronLeft, ChevronRight, Calendar, Moon,
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { motion, useReducedMotion } from 'motion/react'
import { supabasePublic } from '@/lib/supabase/client'

// ── Translations ─────────────────────────────────────────────
const T = {
  ru: {
    langBtn: 'KZzzzz',
    nav: ['Бронь', 'Цены', 'Уровни', 'Трейлер', 'О нас'],
    heroText: 'Твой страх начинается здесь',
    heroBadge: 'Первый хоррор киноквест в Шымкенте',
    heroSub: 'Это не просто просмотр фильмов. Это территория оживших кошмаров. Выбирайте уровень страха и проверьте свои нервы на прочность.',
    book: 'Перейти к бронированию',
    scrollHint: 'Листайте вниз',
    chooseDate: 'Выберите дату',
    today: 'СЕГОДНЯ', tomorrow: 'ЗАВТРА',
    pricesTitle: 'ЦЕНЫ НА КИНОКВЕСТ',
    pricesSub: 'Стоимость фиксируется за всю команду в зависимости от общего количества участников.',
    people: 'человек',
    priceNote: 'Акция 5+1: при группе от 5 человек — 1 место бесплатно.',
    priceBirthday: 'Именинники входят бесплатно!',
    levelsTitle: 'УРОВНИ СТРАХА',
    levelsSub: 'Каждый уровень полностью меняет ваше восприятие. Выберите формат, который выдержит ваша команда.',
    trailerTitle: 'ТРЕЙЛЕР',
    aboutTitle: 'О НАС',
    rulesTitle: 'ПРАВИЛА',
    reviewsTitle: 'ОТЗЫВЫ',
    aboutIntro: `Устали от обычных кинотеатров, где можно спокойно сидеть в кресле и просто смотреть фильм?
Мы представляем вам совершенно новый уровень развлечений — страшный кинотеатр «Астрал Синема».
Здесь вы не просто зритель. Вы становитесь частью происходящего.`,
    aboutFeatures: [
      'Спецэффекты и аниматоры во время сеанса',
      'Формат для компаний от 2 до 16 человек',
      'Просторные залы',
      'Более 100 фильмов ужасов со всего мира',
      'Фотозона',
      'Видео с камер наблюдения после сеанса',
      'Напитки и снэки'
    ],
    noTrailer: 'ТРЕЙЛЕР НЕ ЗАГРУЖЕН',
    noSlots: 'НЕТ СЕАНСОВ',
    noSlotsSub: 'На выбранную дату сеансы не запланированы. Попробуйте другой день.',
    legendFree: 'СВОБОДНО', legendBusy: 'ЗАНЯТО', legendPast: 'ПРОШЁЛ',
    immersionLevel: 'УРОВЕНЬ ПОГРУЖЕНИЯ',
    levelBtn: 'Выбрать Level',
    rules: [
      'Опоздание более 30 минут — сеанс аннулируется без возврата',
      'Алкоголь и наркотики запрещены',
      'Запрещено включать вспышку внутри залов',
      'Нельзя бить аниматоров, штраф 15 000₸',
      'Участие по собственному желанию — отказ принимается',
    ],
    levels: [
      { level: '1',   title: 'Обычный просмотр',           desc: 'Чистая атмосфера фильма без спецэффектов и аниматоров. Идеально для первого знакомства с форматом.' },
      { level: '2',   title: 'Спецэффекты',                desc: 'Внезапные звуковые, световые и тактильные триггеры без прямого участия аниматоров.' },
      { level: '3',   title: 'Спецэффекты + Аниматоры',   desc: 'Актёры заходят в зал во время сеанса. Вы становитесь главной мишенью сюжета.' },
      { level: 'MAX', title: 'LEVEL MAX (Шокеры)',         desc: 'Предельный хоррор. Физический контакт — аниматоры используют шокер. Только для тех, кто реально готов.', isMax: true },
    ],
    prices: [
      { count: 2, price: 7000 }, { count: 3, price: 9000 }, { count: 4, price: 12000 },
      { count: 5, price: 15000 }, { count: 6, price: 18000 }, { count: 7, price: 21000 },
      { count: 8, price: 24000 }, { count: 9, price: 27000 }, { count: 10, price: 30000 },
    ],
  },
  kz: {
    langBtn: 'RU',
    nav: ['Брондау', 'Бағалар', 'Деңгейлер', 'Трейлер', 'Біз туралы'],
    heroText: 'Сенің қорқынышың осы жерде басталады',
    heroBadge: 'Шымкенттегі алғашқы horror киноквест',
    heroSub: 'Бұл жай ғана фильм көру емес. Бұл тіршілікке келген қиянаттар аймағы. Қорқыныш деңгейін таңдаңыз және жүйкеңізді тексеріңіз.',
    book: 'Брондауға өту',
    scrollHint: 'Төмен жылжыңыз',
    chooseDate: 'Күнді таңдаңыз',
    today: 'БҮГІН', tomorrow: 'ЕРТЕҢ',
    pricesTitle: 'КИНОКВЕСТ БАҒАЛАРЫ',
    pricesSub: 'Құны қатысушылардың жалпы санына байланысты бүкіл команда үшін белгіленеді.',
    people: 'адам',
    priceNote: '5+1 акциясы: 5 адамнан топта — 1 орын тегін.',
    priceBirthday: 'Туған күн иелері тегін кіреді!',
    levelsTitle: 'ҚОРҚЫНЫШ ДЕҢГЕЙЛЕРІ',
    levelsSub: 'Әр деңгей сіздің қабылдауыңызды толықтай өзгертеді. Командаңыз шыдай алатын форматты таңдаңыз.',
    trailerTitle: 'ТРЕЙЛЕР',
    aboutTitle: 'БІЗ ТУРАЛЫ',
    rulesTitle: 'ЕРЕЖЕЛЕР',
    reviewsTitle: 'ПІКІРЛЕР',
    aboutIntro: `Кәдімгі кинотеатрлардан шаршадыңыз ба, онда сіз тыныш отыра аласыз және жай ғана фильм көре аласыз ба?
Біз сіздерге ойын — сауықтың жаңа деңгейін-қорқынышты "Астрал Синема"кинотеатрын ұсынамыз.
Мұнда сіз жай көрермен емессіз. Сіз не болып жатқанының бір бөлігіне айналасыз.`,
    aboutFeatures: [
      'Сеанс кезіндегі арнайы әсерлер және аниматорлар',
      '2-ден 16 адамға дейінгі компаниялар үшін Формат',
      'Кең залдар',
      'Әлемнің түкпір-түкпірінен 100-ден астам қорқынышты фильмдер',
      'Фотоаймақ',
      'Сеанстан кейінгі бақылау камераларындағы бейнелер',
      'Сусындар мен чипсилер'
    ],
    noTrailer: 'ТРЕЙЛЕР ЖОҚ',
    noSlots: 'СЕАНС ЖОҚ',
    noSlotsSub: 'Таңдалған күні сеанстар жоқ. Басқа күнді тандаңыз.',
    legendFree: 'БОС', legendBusy: 'БРОНДАЛҒАН', legendPast: 'ӨТТІ',
    immersionLevel: 'БАТЫРУ ДЕҢГЕЙІ',
    levelBtn: 'Level таңдау',
    rules: [
      '30 минуттан астам кешігу — сеанс қайтарусыз жойылады',
      'Алкоголь және есірткі заттары тыйым салынады',
      'Залдардың ішінде жарқылды қосуға тыйым салынады',
      'Аниматорларды ұруға болмайды, айыппұл 15 000₸',
      'Қатысу ерікті — бас тарту қабылданады',
    ],
    levels: [
      { level: '1', title: 'Қарапайым қарау',                   desc: 'Арнайы эффекттер мен тірі актерлерсіз таза фильм атмосферасы. Алғашқы танысу үшін тамаша.' },
      { level: '2', title: 'Арнайы эффекттермен фильм',         desc: 'Кенеттен дыбыстық, жарықтық және тактильді триггерлер. Аниматорлардың тікелей қатысуынсыз.' },
      { level: '3', title: 'Арнайы эффекттер + Аниматорлар',    desc: 'Актерлер сеанс кезінде залға кіреді. Сіз негізгі нысанаға айналатын сюжетке батыру.' },
      { level: 'MAX', title: 'LEVEL MAX (Шокерлер)',              desc: 'Түпкілікті хоррор. Физикалық байланыс, аниматорлар шокер қолданады. Тек мықты жүйкелілер үшін.', isMax: true },
    ],
    prices: [
      { count: 2, price: 7000 }, { count: 3, price: 9000 }, { count: 4, price: 12000 },
      { count: 5, price: 15000 }, { count: 6, price: 18000 }, { count: 7, price: 21000 },
      { count: 8, price: 24000 }, { count: 9, price: 27000 }, { count: 10, price: 30000 },
    ],
  },
}


function getYouTubeId(url?: string) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|embed\/|shorts\/|live\/))([^?&/]+)/)
  return m ? m[1] : ''
}

function resolveHeroBg(val?: string) {
  if (!val) return ''
  const trimmed = val.trim()
  if (/^\d+$/.test(trimmed)) return `/backgrounds/${trimmed}.webp`
  return trimmed
}

export default function HomePageClient({ initialSettings, initialGrid, initialReviews }: { initialSettings: SiteSettings, initialGrid: AvailabilityGrid | null, initialReviews: any[] }) {
  const [lang, setLang]           = useState<Language>('ru')
  const [grid, setGrid]           = useState<AvailabilityGrid | null>(initialGrid)
  const [loading, setLoading]     = useState(initialGrid === null)
  const [selectedDate, setSelDate] = useState(new Date())
  const [settings, setSettings]   = useState<SiteSettings>(initialSettings)
  const [showStickyNav, setShowStickyNav] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const heroNavRef = useRef<HTMLDivElement>(null)

  const sectionRef = {
    reservation: useRef<HTMLElement>(null),
    prices:      useRef<HTMLElement>(null),
    levels:      useRef<HTMLElement>(null),
    trailer:     useRef<HTMLElement>(null),
    about:       useRef<HTMLElement>(null),
  }

  const t = T[lang]

  useEffect(() => {
    settingsApi.get().then(r => setSettings(r.data.data)).catch(() => {})
  }, [])

  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try {
      const res = await availabilityApi.getGrid(format(selectedDate, 'yyyy-MM-dd'))
      setGrid(res.data.data)
    } catch { toast.error(lang === 'kz' ? 'Кесте жүктелмеді' : 'Не удалось загрузить расписание') }
    finally { setLoading(false) }
  }, [selectedDate, lang])

  useEffect(() => { fetchGrid() }, [fetchGrid])

  // Silent background sync via Supabase Realtime
  useEffect(() => {
    if (!supabasePublic) return
    const channel = supabasePublic
      .channel('public:slot_reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slot_reservations' },
        () => fetchGrid()
      )
      .subscribe()
    return () => {
      supabasePublic?.removeChannel(channel)
    }
  }, [fetchGrid])

  // Hand the nav off to the header the moment the hero copy slides under it.
  // The top rootMargin (~header height) makes the swap happen right at the edge,
  // so the buttons never flash or leave a gap during the transition.
  useEffect(() => {
    const el = heroNavRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyNav(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Light up the nav item for whichever section is currently centered on screen.
  useEffect(() => {
    const ids = ['reservation', 'prices', 'levels', 'trailer', 'about']
    const els = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (!els.length) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const scrollTo = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const scrollToReservation = () => scrollTo(sectionRef.reservation)

  const quickDates = useMemo(() => {
    const today = startOfDay(new Date())
    return Array.from({ length: 5 }).map((_, i) => {
      const d = addDays(today, i)
      return {
        date: d,
        short: i === 0 ? t.today : i === 1 ? t.tomorrow : format(d, 'EE', { locale: ru }).toUpperCase(),
        num: format(d, 'd'),
      }
    })
  }, [t.today, t.tomorrow])

  const NAV_SECTIONS = [
    { key: 'reservation', label: t.nav[0], ref: sectionRef.reservation },
    { key: 'prices',      label: t.nav[1], ref: sectionRef.prices },
    { key: 'levels',      label: t.nav[2], ref: sectionRef.levels },
    { key: 'trailer',     label: t.nav[3], ref: sectionRef.trailer },
    { key: 'about',       label: t.nav[4], ref: sectionRef.about },
  ]

  const embedId  = getYouTubeId(settings.youtube_url)
  const embedId2 = getYouTubeId(settings.youtube_url_2 || '')
  const embedId3 = getYouTubeId(settings.youtube_url_3 || '')
  const hasMainTrailer = Boolean(embedId || embedId3)
  const hasAnyTrailer = Boolean(embedId || embedId2 || embedId3)
  const heroBgUrl = resolveHeroBg(settings.hero_bg)


  return (
    <div className="min-h-screen flex flex-col text-gray-100 antialiased selection:bg-red-900 selection:text-white pb-16">

      {/* Global Background Image & Overlay */}
      {heroBgUrl && (
        <>
          <div
            className="fixed inset-0 pointer-events-none z-[0]"
            style={{
              backgroundImage: `url("${heroBgUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden
          />
          <div
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{
              background: `linear-gradient(to bottom, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.55) 40%, rgba(5,5,5,0.95) 100%)`
            }}
            aria-hidden
          />
        </>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b-2 border-red-600 pt-safe"
        style={{
          background: '#000000',
        }}
      >
        {/* Row 1 — Logo + Lang + Admin */}
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0 h-full">
            <img
              src="/logo.webp"
              alt="SHYM CINEMA"
              className="h-full w-auto object-contain"
            />
            <div className="leading-none">
              <p className="font-mono text-[9px] sm:text-[10px] text-red-600 tracking-[0.4em] mt-0.5 uppercase">Shymkent</p>
            </div>
          </div>

          {/* Right: lang toggle */}
          <button
            onClick={() => setLang(l => l === 'ru' ? 'kz' : 'ru')}
            className="relative flex items-center font-mono text-[11px] tracking-widest rounded border border-white/8 bg-black/60 hover:border-red-900/40 transition-colors overflow-hidden"
            style={{ minHeight: 36 }}
            title="Сменить язык / Тілді өзгерту"
            aria-label="Сменить язык / Тілді өзгерту"
          >
            <span
              className={`absolute inset-y-0 w-1/2 bg-red-950/60 border-r border-l border-red-900/25 transition-all duration-300 ease-in-out ${lang === 'kz' ? 'left-1/2' : 'left-0'}`}
            />
            <span className={`relative z-10 w-10 text-center py-2 transition-colors duration-200 ${lang === 'ru' ? 'text-red-400' : 'text-gray-500'}`}>RU</span>
            <span className={`relative z-10 w-10 text-center py-2 transition-colors duration-200 ${lang === 'kz' ? 'text-red-400' : 'text-gray-500'}`}>KZ</span>
          </button>
        </div>

        {/* Row 2 — Nav buttons stick here once hero nav scrolls out of view */}
        {showStickyNav && (
          <div className="max-w-7xl mx-auto px-3 sm:px-5 pb-2.5 animate-slide-down">
            <div className="flex items-stretch gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {NAV_SECTIONS.map(s => {
                const active = activeSection === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => scrollTo(s.ref)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex-shrink-0 flex-1 min-w-[80px] text-center font-mono text-[10px] sm:text-xs tracking-widest uppercase px-3 py-2 rounded-md border transition-all duration-200 ${
                      active
                        ? 'border-red-600/70 bg-red-950/40 text-white shadow-[0_0_14px_rgba(185,28,28,0.25)]'
                        : 'border-white/5 bg-black/30 text-gray-400 hover:border-red-900/50 hover:text-white hover:bg-red-950/20'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex items-center justify-start overflow-hidden border-b border-red-950/30 pt-16">
        <div className="relative z-[2] max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-900/40 bg-red-950/20 backdrop-blur-md rounded-md mb-6 shadow-[inset_0_0_12px_rgba(185,28,28,0.1)]">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
              <p className="font-mono text-[10px] sm:text-xs text-red-400 tracking-[0.15em] uppercase font-semibold">{t.heroBadge}</p>
            </div>

            {/* Big neon text */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight mb-6 uppercase select-none text-left font-display text-white">
              <span className="drip-text block mb-2">{t.heroText.split(' ')[0]}</span>
              {t.heroText.split(' ').slice(1).join(' ')}
            </h1>

            <p className="font-sans text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed mb-10">
              {t.heroSub}
            </p>

            {/* Nav buttons — move to header once scrolled past */}
            <div ref={heroNavRef} className="flex flex-col sm:flex-row items-start gap-4 mb-8 w-full max-w-lg">
              {/* Big book button */}
              <button
                onClick={() => scrollTo(sectionRef.reservation)}
                className="btn-hero-blood w-full sm:w-auto font-mono font-black tracking-[0.15em] uppercase px-8 py-4 text-sm sm:text-base whitespace-nowrap"
              >
                {t.nav[0]}
              </button>

              {/* Other 4 nav buttons */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                {NAV_SECTIONS.slice(1).map(s => {
                  const active = activeSection === s.key
                  return (
                    <button
                      key={s.key}
                      onClick={() => scrollTo(s.ref)}
                      aria-current={active ? 'true' : undefined}
                      className={`group relative px-4 py-3 sm:py-2.5 border font-mono text-[10px] sm:text-xs tracking-wider uppercase rounded-md transition-all duration-200 overflow-hidden flex-1 text-center whitespace-nowrap ${
                        active
                          ? 'border-red-600 bg-red-900/60 text-white shadow-[0_0_16px_rgba(185,28,28,0.4)]'
                          : 'border-red-700/70 bg-red-950/50 text-red-200 hover:border-red-600 hover:text-white hover:bg-red-900/60 hover:shadow-[0_0_16px_rgba(185,28,28,0.4)]'
                      }`}
                    >
                      <span className="relative z-10">{s.label}</span>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
          <div className="hidden lg:block" />
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px z-[2]" style={{ background: 'linear-gradient(90deg,transparent,#8B0000,#dc143c,#8B0000,transparent)' }} />
      </section>

      {/* ── Main Trailer (moved out of hero) ───────────────────────── */}
      {hasMainTrailer && (
        <section ref={sectionRef.trailer} id="trailer" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center border-b border-red-950/20 scroll-mt-36">
          {embedId && (
            <div 
              className={`relative rounded-xl overflow-hidden border border-red-900/30 shadow-2xl ${embedId3 ? 'lg:col-span-2' : 'lg:col-span-3 max-w-4xl mx-auto w-full'}`} 
              style={{ paddingBottom: embedId3 ? '42%' : '56.25%', background: '#000', minHeight: embedId3 ? 'auto' : '300px' }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${embedId}`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Dark Cinema Main Trailer"
              />
            </div>
          )}
          
          {embedId3 && (
            <div className="lg:col-span-1">
              <div className="relative rounded-xl overflow-hidden border border-red-900/30 shadow-2xl mx-auto lg:mx-0 max-w-[280px] w-full" style={{ paddingBottom: '177.78%', background: '#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${embedId3}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Dark Cinema Emotions"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Reservation ───────────────────────────────────────── */}
      <section ref={sectionRef.reservation} id="reservation" className="max-w-7xl mx-auto px-3 sm:px-5 py-16 w-full scroll-mt-36 bg-transparent">
        <div className="flex flex-col items-center gap-3 mb-12 text-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full font-mono text-[10px] tracking-wider uppercase text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            {lang === 'kz' ? 'Онлайн сеанс брондау' : 'Онлайн бронирование сеансов'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mt-2">
            {lang === 'kz' ? 'ОЙЫН УАҚЫТЫН ТАҢДАҢЫЗ' : 'ВЫБЕРИТЕ ВРЕМЯ ИГРЫ'}
          </h2>
        </div>

        {/* Date picker */}
        <div className="mb-8 w-full max-w-2xl mx-auto bg-[#0a0a0a] border border-white/5 p-4 rounded-xl shadow-2xl">
          {/* Quick chips */}
          <div className="flex items-stretch gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {quickDates.map(({ date, short, num }) => {
              const active = isSameDay(date, selectedDate)
              return (
                <button
                  key={short + num}
                  onClick={() => setSelDate(date)}
                  aria-pressed={active}
                  className={`flex-shrink-0 flex-1 min-w-[78px] px-3 py-2.5 rounded-lg border transition-all text-center ${
                    active
                      ? 'border-red-600 bg-red-950/30 shadow-[0_0_20px_rgba(220,20,60,0.2)]'
                      : 'border-white/5 bg-black hover:border-red-900/40 hover:bg-red-950/5'
                  }`}
                >
                  <div className={`font-mono text-[10px] tracking-widest ${active ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{short}</div>
                  <div className={`text-xl font-black leading-none mt-1.5 ${active ? 'text-white' : 'text-gray-300'}`}>{num}</div>
                </button>
              )
            })}
          </div>

          {/* Arrow nav */}
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setSelDate(d => subDays(d, 1))}
              className="border border-white/5 bg-black hover:border-red-900/40 hover:text-white transition-all rounded-lg flex items-center justify-center text-gray-400"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'kz' ? 'Алдыңғы күн' : 'Предыдущий день'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              className="flex-1 text-center py-2.5 border border-red-900/30 bg-gradient-to-b from-red-950/10 to-transparent rounded-lg"
              style={{ maxWidth: 320 }}
            >
              <p className="font-mono text-xs sm:text-sm tracking-wider font-bold text-gray-200 uppercase">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
              </p>
            </div>
            <button
              onClick={() => setSelDate(d => addDays(d, 1))}
              className="border border-white/5 bg-black hover:border-red-900/40 hover:text-white transition-all rounded-lg flex items-center justify-center text-gray-400"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'kz' ? 'Келесі күн' : 'Следующий день'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="relative min-h-[300px]">
          {loading
            ? <GridSkeleton />
            : grid && grid.rooms.length > 0
              ? <ReservationGrid grid={grid} lang={lang} whatsappNumber={settings.whatsapp_number} />
              : <EmptyState t={t} />
          }
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-3 justify-items-center mt-10 pt-6" style={{ borderTop: '1px solid rgba(139,0,0,0.2)' }}>
          <LegendDot color="bg-green-900/40 border-green-600/50 text-green-400"  label={t.legendFree} />
          <LegendDot color="bg-red-900/40 border-red-600/50 text-red-400"        label={t.legendBusy} />
          <LegendDot color="bg-neutral-900/60 border-neutral-700 text-neutral-500 border-dashed" label={t.legendPast} />
        </div>
      </section>

      {/* ── Prices ─────────────────────────────── */}
      <section ref={sectionRef.prices} id="prices" className="pt-10 pb-12 bg-transparent border-b border-red-950/20 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase mb-2 text-white">
              {t.pricesTitle}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">{t.pricesSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-3 rounded-xl bg-amber-950/10 border border-amber-800/30 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="font-sans text-xs sm:text-sm text-amber-200/90 leading-snug">{t.priceNote}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-3 rounded-xl bg-red-950/20 border border-red-800/30 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="font-sans text-xs sm:text-sm text-red-200/90 leading-snug font-semibold">{t.priceBirthday}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-w-5xl mx-auto">
            {t.prices.map((p, i) => (
              <motion.div
                key={p.count}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-red-950/20 hover:border-red-900/50 transition-all group"
              >
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl sm:text-3xl font-black text-white group-hover:text-red-400 transition-colors">{p.count}</span>
                  <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">{t.people}</span>
                </div>
                <div className="w-6 h-px bg-red-900/30 my-0.5 group-hover:bg-red-600/50 transition-colors" />
                <span className="font-mono text-sm sm:text-base font-bold text-gray-300 group-hover:text-white transition-colors">{p.price.toLocaleString('ru-RU')} ₸</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Levels (card grid) ────────────────────────────────── */}
      <section ref={sectionRef.levels} id="levels" className="pt-6 pb-8 bg-transparent border-b border-red-950/20 scroll-mt-36">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white mb-4">
              {t.levelsTitle}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">{t.levelsSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-red-950/20 rounded-xl overflow-hidden border border-red-950/20">
            {t.levels.map((lvl) => (
              <div
                key={lvl.level}
                className={`flex flex-col gap-1.5 px-7 py-5 bg-[#070202] ${lvl.isMax ? 'border-t-2 border-red-600' : 'border-t-2 border-transparent'}`}
              >
                <span className={`font-mono text-xl sm:text-2xl tracking-[0.15em] font-black uppercase ${lvl.isMax ? 'text-red-500' : 'text-red-700'}`}>
                  LEVEL {lvl.level}
                </span>
                <p className="text-white text-sm font-semibold leading-snug">{lvl.title}</p>
                {lvl.desc && (
                  <p className="text-gray-500 text-xs leading-snug mt-0.5">{lvl.desc}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trailer ──────────────────────────────────────────── */}
      {(embedId2 || !hasAnyTrailer) && (
        <section
          ref={!hasMainTrailer ? sectionRef.trailer : undefined}
          id={!hasMainTrailer ? 'trailer' : undefined}
          className="pt-6 pb-10 bg-transparent border-b border-red-950/20 scroll-mt-36"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {embedId2 ? (
              <div className="relative rounded-xl overflow-hidden border border-red-900/30" style={{ paddingBottom: '56.25%', background: '#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${embedId2}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Dark Cinema Trailer 2"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center border border-red-900/20 rounded-xl bg-black/40" style={{ aspectRatio: '16/9' }}>
                <p className="font-mono text-xs text-gray-600 tracking-widest">{t.noTrailer}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── About + Rules ─────────────────────────────────────── */}
      <section ref={sectionRef.about} id="about" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full scroll-mt-24 bg-transparent border-b border-red-950/20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white">
            {t.aboutTitle}
          </h2>
        </div>
        <div className="border border-red-900/25 rounded-xl bg-black/40 p-6 sm:p-8 mb-12 shadow-2xl">
          <p className="font-sans text-base sm:text-lg text-gray-300 leading-relaxed whitespace-pre-line mb-6">{t.aboutIntro}</p>
          <div className="border border-red-900/25 rounded-xl overflow-hidden bg-black/40">
            {t.aboutFeatures.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3"
                style={{ borderBottom: i < t.aboutFeatures.length - 1 ? '1px solid rgba(139,0,0,0.12)' : 'none' }}
              >
                <span className="drip-text text-xs mt-0.5 flex-shrink-0">▸</span>
                <p className="font-sans text-sm sm:text-base text-gray-300 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white">
            {t.rulesTitle}
          </h3>
        </div>
        <div className="border border-red-900/25 rounded-xl overflow-hidden bg-black/40">
          {t.rules.map((rule, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-2.5"
              style={{ borderBottom: i < t.rules.length - 1 ? '1px solid rgba(139,0,0,0.12)' : 'none' }}
            >
              <span className="drip-text text-xs mt-0.5 flex-shrink-0">▸</span>
              <p className="font-sans text-xs text-gray-300 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full bg-transparent">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white">
            {t.reviewsTitle}
          </h2>
        </div>
        <Reviews lang={lang} initialReviews={initialReviews} />
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-12 px-4 text-center border-t border-red-950/40 bg-[#030303]/85">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
          <Moon className="w-3.5 h-3.5 text-red-800" />
          <p className="font-mono text-xs tracking-[0.3em] text-red-700 font-bold uppercase">© DARK CINEMA · SHYMKENT</p>
          <Moon className="w-3.5 h-3.5 text-red-800" />
        </div>
        <div className="flex justify-center gap-2.5 flex-wrap max-w-xl mx-auto">
          {[
            { name: 'Instagram', href: 'https://instagram.com/dark_cinema_shymkent' },
            { name: 'WhatsApp', href: `https://wa.me/${settings.whatsapp_number}` },
            { name: 'TikTok', href: 'https://www.tiktok.com/@dark_cinema_shym?_r=1&_t=ZS-96ngw0JNOVj' },
            { name: '2GIS', href: 'https://2gis.kz/shymkent/geo/70000001082734865' },
          ].map(l => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs tracking-widest uppercase px-5 py-3 rounded border border-white/5 bg-black text-gray-400 hover:border-red-800/60 hover:text-white hover:bg-red-950/10 transition-all duration-200"
            >
              {l.name}
            </a>
          ))}
        </div>
      </footer>

      <BottomNav lang={lang} />
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black border border-white/5">
      <div className={`w-3 h-3 rounded-sm flex-shrink-0 border ${color}`} />
      <span className="font-mono text-[11px] tracking-widest font-bold text-gray-400">{label}</span>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse" aria-busy="true">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {[0, 1, 2, 3].map(j => <div key={j} className="h-20 bg-white/5 rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ t }: { t: typeof T['ru'] }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-red-950/30 rounded-xl bg-black/40">
      <div className="drip-text text-5xl animate-pulse-soft">☠</div>
      <p className="font-mono text-sm text-white tracking-widest uppercase font-bold">{t.noSlots}</p>
      <p className="font-sans text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">{t.noSlotsSub}</p>
    </div>
  )
}

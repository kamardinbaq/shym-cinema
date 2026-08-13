'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { questApi, settingsApi } from '@/lib/api'
import type { Language, SiteSettings, AvailabilityGrid } from '@/types'
import ReservationGrid from '@/components/ReservationGrid'
import Reviews from '@/components/Reviews'
import BottomNav from '@/components/BottomNav'
import { Moon, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { supabasePublic } from '@/lib/supabase/client'

// ── Translations ──────────────────────────────────────────────
const T = {
  ru: {
    nav: ['Бронь', 'Цены', 'Уровни', 'Трейлер', 'О нас'],
    noTrailer: 'ТРЕЙЛЕР НЕ ЗАГРУЖЕН',
    heroText: 'чеLOVEку НУЖЕН ADRENALINE',
    heroBadge: 'Хоррор-квест в реальности · Шымкент',
    heroSub: 'Тёмные комнаты. Живые актёры. Настоящий ужас. Соберите команду и пройдите испытание.',
    chooseDate: 'Выберите дату',
    today: 'СЕГОДНЯ', tomorrow: 'ЗАВТРА',
    pricesTitle: 'ЦЕНЫ НА КВЕСТ',
    pricesSub: 'Стоимость фиксируется за всю команду в зависимости от общего количества участников.',
    people: 'человек',
    priceBirthday: 'Именинники входят бесплатно!',
    priceNote: 'Акция 5+1: при группе от 5 человек — 1 место бесплатно.',
    levelsTitle: 'УРОВНИ СТРАХА',
    levelsSub: 'Каждый уровень полностью меняет ваше восприятие. Выберите формат, который выдержит ваша команда.',
    aboutTitle: 'О НАС',
    rulesTitle: 'ПРАВИЛА',
    aboutIntro: 'Ты знаешь, что такое хоррор-квест. Но забудь про банальные «БУ!» и бесконечную темноту. У нас всё иначе:',
    aboutFeatures: [
      'Эмоции от страха до смеха',
      'Живые персонажи, с которыми придётся общаться',
      'Тайны, которые откроются только тем, кто сумеет расположить ум к себе',
      'Погружение начинается с первой минуты, и ты забудешь, что это игра',
      'Тёмные коридоры, реальные актёры, неожиданные повороты сюжета и настоящий адреналин!',
      'Здесь тебе предстоит решать головоломки, искать выход и бороться с собственным страхом',
      'Ты не просто зритель - ты главный герой'
    ],
    rules: [
      'Опоздание более 10 минут — сеанс аннулируется без возврата',
      'Алкоголь и наркотики строго запрещены',
      'Запрещено разделяться без ведома ведущего',
      'Нельзя бить аниматоров, штраф 15 000₸',
      'Участие добровольное — можно выйти в любой момент',
      'Минимум 4 участника для начала сеанса',
    ],
    levels: [
      { level: '1',   title: 'Детский режим',                        desc: 'Режим для подростков 10–13 лет. Физическое взаимодействие минимальное. Актёры появляются, но команду почти не трогают — вы ощутите их присутствие и услышите голос. Захватывающий и немного напряжённый уровень заставит вас побегать: чувство скрытой угрозы не покинет до самого конца. ' },
      { level: '2',   title: 'Молодёжный режим',                   desc: 'Для молодёжи 16+. Физическое взаимодействие актёров более плотное. Персонажи проявляют активную интерактивность — трогают, хватают, грубят и могут пугать всем, чем захотят. ' },
      { level: '3',   title: 'Взрослый режим',     desc: 'Актёры будут делать с вами всё, что захотят. Присутствует грубый физический контакт и болевые ощущения, включая электрошок. Для прохождения необходимо предоставить видеоподтверждение отсутствия претензий ко всему, что с вами произойдёт.' },
      { level: 'MAX', title: 'Ultra Hard',     desc: 'Для псически неотклоненных людей опасно для жизни', isMax: true },
    ],
    prices: [
      { label: '4–5', price: 15000 },
      { label: '6',   price: 18000 },
      { label: '7',   price: 21000 },
      { label: '8',   price: 24000 },
      { label: '9',   price: 27000 },
      { label: '10',  price: 30000 },
      { label: '11',  price: 33000 },
      { label: '12',  price: 36000 },
      { label: '13',  price: 39000 },
      { label: '14',  price: 42000 },
      { label: '15',  price: 45000 },
    ],
    waMsg: (time: string) =>
      encodeURIComponent(`Хочу забронировать Dark Quest на сеанс ${time}`),
  },
  kz: {
    nav: ['Бронь', 'Бағалар', 'Деңгейлер', 'Трейлер', 'Біз туралы'],
    noTrailer: 'ТРЕЙЛЕР ЖОҚ',
    heroText: 'АДАMҒА ADRENALINE КЕРЕК',
    heroBadge: 'Шынайы хоррор-квест · Шымкент',
    heroSub: 'Қараңғы бөлмелер. Тірі актерлер. Нағыз қорқыныш. Командаңызды жинап, сынақтан өтіңіз.',
    chooseDate: 'Күнді таңдаңыз',
    today: 'БҮГІН', tomorrow: 'ЕРТЕҢ',
    pricesTitle: 'КВЕСТ БАҒАЛАРЫ',
    pricesSub: 'Құны қатысушылардың жалпы санына байланысты бүкіл команда үшін белгіленеді.',
    people: 'адам',
    priceBirthday: 'Туған күн иелері тегін кіреді!',
    priceNote: '5+1 акциясы: 5 адамнан топта — 1 орын тегін.',
    levelsTitle: 'ҚОРҚЫНЫШ ДЕҢГЕЙЛЕРІ',
    levelsSub: 'Әр деңгей сіздің қабылдауыңызды толықтай өзгертеді. Командаңыз шыдай алатын форматты таңдаңыз.',
    aboutTitle: 'БІЗ ТУРАЛЫ',
    rulesTitle: 'ЕРЕЖЕЛЕР',
    aboutIntro: 'Сіз қорқынышты ізденістің не екенін білесіз. Бірақ банальные туралы ұмытыңыз " БУ!"және шексіз қараңғылық. Бізде бәрі басқаша:',
    aboutFeatures: [
      'Қорқыныштан күлкіге дейінгі эмоциялар',
      'Сөйлесуге тура келетін тірі кейіпкерлер',
      'Ақыл-ойды өзіне қарай реттей алатындарға ғана ашылатын құпиялар',
      'Сүңгу бірінші минуттан басталады және сіз бұл ойын екенін ұмытып кетесіз',
      'Қараңғы дәліздер, нақты актерлер, күтпеген сюжеттік бұрылыстар және нағыз адреналин!',
      'Мұнда сіз басқатырғыштарды шешіп, шығудың жолын іздеп, өз қорқынышыңызбен күресуіңіз керек',
      'Сіз жай көрермен емессіз-сіз басты кейіпкерсіз'
    ],
    rules: [
      '10 минуттан астам кешігу — сеанс қайтарусыз жойылады',
      'Алкоголь және есірткі заттары қатаң тыйым салынады',
      'Жетекшінің рұқсатынсыз бөлінуге тыйым салынады',
      'Аниматорларды ұруға болмайды, айыппұл 15 000₸',
      'Қатысу ерікті — кез келген уақытта шығуға болады',
      'Сеансты бастау үшін кемінде 4 қатысушы қажет',
    ],
    levels: [
      { level: '1',   title: 'Балалар режимі',                          desc: '10-13 жас аралығындағы жасөспірімдерге арналған Режим. Физикалық өзара әрекеттесу минималды. Актерлер пайда болады, бірақ команда әрең қозғалады — сіз олардың қатысуын сезінесіз және дауысты естисіз. Қызықты және сәл шиеленісті деңгей сізді жүгіруге мәжбүр етеді: жасырын қауіп сезімі соңына дейін кетпейді.' },
      { level: '2',   title: 'Жастар режимі',                 desc: 'Жастар үшін 16+. Актерлердің физикалық өзара әрекеттесуі тығыз. Кейіпкерлер белсенді интерактивтілікті көрсетеді-олар қол тигізеді, ұстайды, дөрекі және қалағанының бәрін қорқыта алады.' },
      { level: '3',   title: 'Ересектер режимі',           desc: 'Актерлер сізбен қалағанын жасайды. Дөрекі физикалық байланыс және ауырсыну, соның ішінде электр тогы бар. Өту үшін сізбен болатын барлық нәрсеге шағымдардың жоқтығы туралы бейне Растауды ұсынуыңыз керек.' },
      { level: 'MAX', title: 'Ultra Hard',           desc: 'Психикалық ауытқыған адамдар үшін өмірге қауіп төндіреді', isMax: true },
    ],
    prices: [
      { label: '4–5', price: 15000 },
      { label: '6',   price: 18000 },
      { label: '7',   price: 21000 },
      { label: '8',   price: 24000 },
      { label: '9',   price: 27000 },
      { label: '10',  price: 30000 },
      { label: '11',  price: 33000 },
      { label: '12',  price: 36000 },
      { label: '13',  price: 39000 },
      { label: '14',  price: 42000 },
      { label: '15',  price: 45000 },
    ],
    waMsg: (time: string) =>
      encodeURIComponent(`Dark Quest сеансына брондағым келеді — ${time}`),
  },
}

function resolveHeroBg(val?: string) {
  if (!val) return ''
  const trimmed = val.trim()
  if (/^\d+$/.test(trimmed)) return `/backgrounds/${trimmed}.webp`
  return trimmed
}

function getYouTubeId(url?: string) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|embed\/|shorts\/|live\/))([^?&/]+)/)
  return m ? m[1] : ''
}

export default function QuestPageClient({ initialSettings, initialGrid, initialReviews }: { initialSettings: SiteSettings, initialGrid: AvailabilityGrid | null, initialReviews: any[] }) {
  const [lang, setLang]           = useState<Language>('ru')
  const [settings, setSettings]   = useState<SiteSettings>(initialSettings)
  const [grid, setGrid]           = useState<AvailabilityGrid | null>(initialGrid)
  const [loading, setLoading]     = useState(initialGrid === null)
  const [selectedDate, setSelDate] = useState(new Date())
  const [showStickyNav, setShowStickyNav] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const heroNavRef = useRef<HTMLDivElement>(null)

  const sectionRef = {
    schedule: useRef<HTMLElement>(null),
    prices:   useRef<HTMLElement>(null),
    levels:   useRef<HTMLElement>(null),
    trailer:  useRef<HTMLDivElement>(null),
    about:    useRef<HTMLElement>(null),
  }

  const t = T[lang]
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    settingsApi.get().then(r => setSettings(r.data.data)).catch(() => {})
  }, [])

  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try {
      const res = await questApi.getGrid(format(selectedDate, 'yyyy-MM-dd'))
      setGrid(res.data.data)
    } catch { toast.error(lang === 'kz' ? 'Кесте жүктелмеді' : 'Не удалось загрузить расписание') }
    finally { setLoading(false) }
  }, [selectedDate, lang])

  useEffect(() => { fetchGrid() }, [fetchGrid])

  // Disable realtime sync temporarily to prevent DDOS on local dev server
  /*
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
  */

  useEffect(() => {
    const el = heroNavRef.current
    if (!el) return
    const headerOffset = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 72
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyNav(!entry.isIntersecting && entry.boundingClientRect.top < headerOffset),
      { rootMargin: `-${headerOffset}px 0px 0px 0px`, threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const ids = ['schedule', 'prices', 'levels', 'trailer', 'about']
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

  const scrollTo = (ref: React.RefObject<HTMLElement>) =>
    ref.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })

  const heroBgUrl = resolveHeroBg(settings.quest_hero_bg)
  const embedId = getYouTubeId(settings.quest_youtube_url)
  const embedId2 = getYouTubeId(settings.quest_youtube_url_2)
  const embedId3 = getYouTubeId(settings.quest_youtube_url_3)

  const quickDates = Array.from({ length: 5 }).map((_, i) => {
    const today = startOfDay(new Date())
    const d = addDays(today, i)
    return {
      date: d,
      short: i === 0 ? t.today : i === 1 ? t.tomorrow : format(d, 'EE', { locale: ru }).toUpperCase(),
      num: format(d, 'd'),
    }
  })

  const NAV_SECTIONS = [
    { key: 'schedule', label: t.nav[0], ref: sectionRef.schedule },
    { key: 'prices',   label: t.nav[1], ref: sectionRef.prices },
    { key: 'levels',   label: t.nav[2], ref: sectionRef.levels },
    { key: 'trailer',  label: t.nav[3], ref: sectionRef.trailer as React.RefObject<HTMLElement> },
    { key: 'about',    label: t.nav[4], ref: sectionRef.about },
  ]

  return (
    <div className="public-site quest-site min-h-screen flex flex-col text-gray-100 antialiased selection:bg-red-900 selection:text-white pb-24">

      {/* Global Background Image & Overlay */}
      {heroBgUrl && (
        <>
          <div
            className="site-background fixed inset-0 pointer-events-none z-[0]"
            style={{
              backgroundImage: `url("${heroBgUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden
          />
          <div
            className="site-background-overlay fixed inset-0 pointer-events-none z-[1]"
            aria-hidden
          />
        </>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="site-header sticky top-0 z-40 pt-safe"
        style={{ background: '#000000' }}
      >
        <div className="site-header__bar max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="site-brand flex items-center gap-3 flex-shrink-0 h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-quest.webp" alt="DARK QUEST" className="site-logo h-full w-auto object-contain" />
            <div className="leading-none">
              <p className="font-mono text-[9px] sm:text-[10px] text-red-600 tracking-[0.4em] mt-0.5 uppercase">Shymkent</p>
            </div>
          </div>

          <button
            onClick={() => setLang(l => l === 'ru' ? 'kz' : 'ru')}
            className="language-switch relative flex items-center font-mono text-[11px] tracking-widest overflow-hidden"
            style={{ minHeight: 36 }}
            aria-label="Сменить язык / Тілді өзгерту"
          >
            <span
              className={`absolute inset-y-0 w-1/2 bg-red-950/60 border-r border-l border-red-900/25 transition-all duration-300 ease-in-out ${lang === 'kz' ? 'left-1/2' : 'left-0'}`}
            />
            <span className={`relative z-10 w-10 text-center py-2 transition-colors duration-200 ${lang === 'ru' ? 'text-red-400' : 'text-gray-500'}`}>RU</span>
            <span className={`relative z-10 w-10 text-center py-2 transition-colors duration-200 ${lang === 'kz' ? 'text-red-400' : 'text-gray-500'}`}>KZ</span>
          </button>
        </div>

        {showStickyNav && (
          <div className="section-dock max-w-7xl mx-auto px-4 sm:px-6 pb-3 animate-slide-down">
            <div className="section-dock__track flex items-stretch gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {NAV_SECTIONS.map(s => {
                const active = activeSection === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => scrollTo(s.ref)}
                    aria-current={active ? 'true' : undefined}
                    className={`section-dock__item flex-shrink-0 flex-1 min-w-[80px] text-center font-mono text-[10px] sm:text-xs tracking-widest uppercase px-3 py-2 transition-all duration-200 ${
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="site-hero relative flex items-center overflow-hidden">
        <div className="site-hero__inner relative z-[2] max-w-7xl w-full mx-auto px-4 sm:px-6">
          <motion.div 
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-layout w-full"
          >
            <div className="hero-eyebrow inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
              <p className="font-mono text-[10px] sm:text-xs text-red-400 tracking-[0.25em] uppercase">{t.heroBadge}</p>
            </div>

            <h1 className="hero-title drip-text font-extrabold uppercase select-none">
              {t.heroText}
            </h1>

            <p className="hero-summary font-sans text-base sm:text-lg text-gray-400 leading-relaxed">
              {t.heroSub}
            </p>

            <div ref={sectionRef.trailer} id="trailer" className="hero-video hero-video--primary w-full scroll-mt-36">
              {embedId ? (
                <div className="video-frame relative overflow-hidden" style={{ paddingBottom: '56.25%', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${embedId}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Dark Quest Trailer"
                  />
                </div>
              ) : (
                <div className="video-frame flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                  <p className="font-mono text-xs text-gray-600 tracking-widest">{t.noTrailer}</p>
                </div>
              )}
            </div>

            {embedId3 && (
              <div className="hero-reaction w-full max-w-xs">
                <h2 className="reaction-title drip-text text-3xl sm:text-4xl font-extrabold tracking-widest uppercase block">
                  ЭМОЦИИ ПОСЛЕ СЕАНСА
                </h2>
                <div className="video-frame video-frame--portrait relative overflow-hidden" style={{ paddingBottom: '177.78%', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${embedId3}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Dark Quest Trailer 3"
                  />
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div ref={heroNavRef} className="hero-actions flex flex-col items-start gap-4 w-full">
              <button
                onClick={() => scrollTo(sectionRef.schedule)}
                className="btn-hero-blood w-full max-w-sm font-mono font-black tracking-[0.18em] uppercase px-8 py-4 text-sm sm:text-base"
              >
                {t.nav[0]}
              </button>

              <div className="hero-link-row flex flex-wrap gap-x-6 gap-y-3">
                {NAV_SECTIONS.slice(1).map(s => {
                  const active = activeSection === s.key
                  return (
                    <button
                      key={s.key}
                      onClick={() => scrollTo(s.ref)}
                      aria-current={active ? 'true' : undefined}
                      className={`hero-text-link group relative font-mono text-[11px] sm:text-xs tracking-widest uppercase transition-all duration-200 ${
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
        </div>

        <div className="hero-rule absolute bottom-0 left-0 right-0 z-[2]" />
      </section>

      {/* ── Schedule (Reservation Grid) ──────────────────────── */}
      <section ref={sectionRef.schedule} id="schedule" className="booking-section site-section max-w-7xl mx-auto px-4 sm:px-6 w-full scroll-mt-36">
        <div className="section-intro flex flex-col gap-3">
          <div className="section-kicker flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            {lang === 'kz' ? 'Онлайн квест брондау' : 'Онлайн бронирование квеста'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mt-2">
            {lang === 'kz' ? 'ОЙЫН УАҚЫТЫН ТАҢДАҢЫЗ' : 'ВЫБЕРИТЕ ВРЕМЯ ИГРЫ'}
          </h2>
        </div>

        {/* Date picker */}
        <div className="date-panel mb-10 w-full max-w-3xl p-3 sm:p-4">
          {/* Quick chips */}
          <div className="quick-date-track flex items-stretch gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {quickDates.map(({ date, short, num }) => {
              const active = isSameDay(date, selectedDate)
              return (
                <button
                  key={short + num}
                  onClick={() => setSelDate(date)}
                  aria-pressed={active}
                  className={`date-chip flex-shrink-0 flex-1 min-w-[78px] px-3 py-2.5 transition-all text-center ${
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
              className="date-arrow flex items-center justify-center text-gray-400"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'kz' ? 'Алдыңғы күн' : 'Предыдущий день'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              className="date-current flex-1 text-center py-2.5"
              style={{ maxWidth: 320 }}
            >
              <p className="font-mono text-xs sm:text-sm tracking-wider font-bold text-gray-200 uppercase">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ru })}
              </p>
            </div>
            <button
              onClick={() => setSelDate(d => addDays(d, 1))}
              className="date-arrow flex items-center justify-center text-gray-400"
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
              ? <ReservationGrid grid={grid} lang={lang} whatsappNumber={settings.quest_whatsapp_number || settings.whatsapp_number} />
              : <EmptyState t={t} />
          }
        </div>

        {/* Legend */}
        <div className="booking-legend grid grid-cols-3 gap-3 justify-items-center mt-10 pt-6">
          <LegendDot color="bg-green-900/40 border-green-600/50 text-green-400"  label={lang === 'kz' ? 'БОС' : 'СВОБОДНО'} />
          <LegendDot color="bg-red-900/40 border-red-600/50 text-red-400"        label={lang === 'kz' ? 'БРОНДАЛҒАН' : 'ЗАНЯТО'} />
          <LegendDot color="bg-neutral-900/60 border-neutral-700 text-neutral-500 border-dashed" label={lang === 'kz' ? 'ӨТТІ' : 'ПРОШЁЛ'} />
        </div>
      </section>

      {/* ── Prices ─────────────────────────────── */}
      <section ref={sectionRef.prices} id="prices" className="price-section site-section scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="section-intro mb-10 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase mb-2 text-white">
              {t.pricesTitle}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">{t.pricesSub}</p>
          </div>

          <div className="price-notes grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-w-4xl">
            <motion.div 
              initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="notice-panel p-4 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="font-sans text-xs sm:text-sm text-amber-200/90 leading-snug">{t.priceNote}</p>
            </motion.div>
            
            <motion.div 
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="notice-panel notice-panel--accent p-4 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="font-sans text-xs sm:text-sm text-red-200/90 leading-snug font-semibold">{t.priceBirthday}</p>
            </motion.div>
          </div>

          <div className="price-grid grid grid-cols-2 sm:grid-cols-3">
            {t.prices.map((p, i) => (
              <motion.div
                key={p.label}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="price-card flex flex-col items-start justify-center gap-2 p-4 sm:p-5 transition-all group"
              >
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl sm:text-3xl font-black text-white group-hover:text-red-400 transition-colors">{p.label}</span>
                  <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">{t.people}</span>
                </div>
                <div className="w-6 h-px bg-red-900/30 my-0.5 group-hover:bg-red-600/50 transition-colors" />
                <span className="font-mono text-sm sm:text-base font-bold text-gray-300 group-hover:text-white transition-colors">{p.price.toLocaleString('ru-RU')} ₸</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Levels ───────────────────────────────────────────── */}
      <section ref={sectionRef.levels} id="levels" className="levels-section site-section scroll-mt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="section-intro mb-12 max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white mb-4">
              {t.levelsTitle}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">{t.levelsSub}</p>
          </div>

          <div className="level-list grid grid-cols-1 md:grid-cols-2">
            {t.levels.map((lvl) => (
              <div
                key={lvl.level}
                className={`level-card flex flex-col gap-3 px-6 py-7 ${lvl.isMax ? 'level-card--max' : ''}`}
              >
                <span className={`font-mono text-xl sm:text-2xl tracking-[0.15em] font-black uppercase ${lvl.isMax ? 'text-red-500' : 'text-red-700'}`}>
                  LEVEL {lvl.level}
                </span>
                <p className="text-white text-sm font-semibold leading-snug">{lvl.title}</p>
                {lvl.desc && (
                  <p className="text-gray-500 text-xs leading-snug">({lvl.desc})</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trailer ──────────────────────────────────────────── */}
      {embedId2 && (
        <section className="secondary-video-section site-section scroll-mt-36">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="video-frame relative overflow-hidden" style={{ paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${embedId2}`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Dark Quest Trailer 2"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── About + Rules ────────────────────────────────────── */}
      <section ref={sectionRef.about} id="about" className="about-section site-section max-w-7xl mx-auto px-4 sm:px-6 w-full scroll-mt-24">
        <div className="about-heading section-intro mb-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white">
            {t.aboutTitle}
          </h2>
        </div>
        <div className="about-panel p-6 sm:p-9">
          <p className="font-sans text-base sm:text-lg text-gray-300 leading-relaxed whitespace-pre-line mb-6">{t.aboutIntro}</p>
          <div className="feature-list overflow-hidden">
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

        <div className="rules-heading section-intro mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white">
            {t.rulesTitle}
          </h3>
        </div>
        <div className="rules-list overflow-hidden">
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

      {/* ── Reviews ─────────────────────────────────────────── */}
      <section className="reviews-section site-section max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="section-intro mb-12">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase text-white">
            {lang === 'kz' ? 'ПІКІРЛЕР' : 'ОТЗЫВЫ'}
          </h2>
        </div>
        <Reviews lang={lang} venue="QUEST" initialReviews={initialReviews} />
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="site-footer py-14 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
          <Moon className="w-3.5 h-3.5 text-red-800" />
          <p className="font-mono text-xs tracking-[0.3em] text-red-700 font-bold uppercase">© DARK QUEST · SHYMKENT</p>
          <Moon className="w-3.5 h-3.5 text-red-800" />
        </div>
        <div className="flex justify-center gap-2.5 flex-wrap max-w-xl mx-auto">
          {[
            { name: 'Instagram', href: 'https://www.instagram.com/dark_quest_shymkent?igsh=bW9ncTFpNWR6Yzlo' },
            { name: 'WhatsApp', href: `https://wa.me/${settings.quest_whatsapp_number || settings.whatsapp_number}` },
            { name: 'TikTok', href: 'https://www.tiktok.com/@dark_quest_shymkent3?_r=1&_t=ZS-96oZOb9xYn9' },
            { name: '2GIS', href: 'https://2gis.kz/shymkent/geo/70000001083681979' },
          ].map(l => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link font-mono text-xs tracking-widest uppercase px-5 py-3 text-gray-400 transition-all duration-200"
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
    <div className="legend-item flex items-center gap-2 px-3 py-1.5">
      <div className={`w-3 h-3 rounded-sm flex-shrink-0 border ${color}`} />
      <span className="font-mono text-[11px] tracking-widest font-bold text-gray-400">{label}</span>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse" aria-busy="true">
      {[0, 1, 2].map(i => (
        <div key={i} className="skeleton-panel p-5 space-y-4">
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
    <div className="empty-panel flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="drip-text text-5xl animate-pulse-soft">☠</div>
      <p className="font-mono text-sm text-white tracking-widest uppercase font-bold">НЕТ СЕАНСОВ</p>
      <p className="font-sans text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">На выбранную дату сеансы не запланированы. Попробуйте другой день.</p>
    </div>
  )
}

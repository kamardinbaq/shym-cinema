'use client'
import { useEffect, useState, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import { adminApi, reviewApi, availabilityApi, questApi } from '@/lib/api'
import { useAdminStore } from '@/lib/store'
import type { AvailabilityGrid, AdminUser, Review } from '@/types'
import ReservationGrid from '@/components/ReservationGrid'
import {
  Skull, LogOut, RefreshCw, ChevronLeft, ChevronRight,
  Settings, Users, MessageSquare, Calendar, Trash2, Plus, Shield, Save,
} from 'lucide-react'

type Tab = 'reservations' | 'reviews' | 'settings' | 'users'

/* ── Login Screen ─────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { setAuth } = useAdminStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!username || !password) { toast.error('Заполните все поля'); return }
    setLoading(true)
    try {
      const res = await adminApi.login(username, password)
      setAuth(res.data.data)
      toast.success(`Добро пожаловать, ${res.data.data.username}`)
      onLogin()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Неверные данные')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--void)' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-red-900 mx-auto mb-4"/>
          <p className="font-display text-sm text-bone tracking-widest">DARK CINEMA</p>
          <p className="font-mono text-[10px] text-red-800 tracking-widest mt-1">ADMIN ACCESS</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-1.5">USERNAME</label>
            <input className="horror-input w-full" placeholder="username" value={username}
              onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()}/>
          </div>
          <div>
            <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-1.5">PASSWORD</label>
            <input type="password" className="horror-input w-full" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()}/>
          </div>
          <button onClick={handleLogin} disabled={loading} className="btn-blood w-full">
            {loading ? <span className="animate-pulse">ВХОДИМ...</span> : 'ВОЙТИ'}
          </button>
          <a href="/" className="btn-ghost w-full text-center block text-xs py-2 px-4">← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  )
}

/* ── Main Admin Panel ─────────────────────────────────────── */
export default function AdminPage() {
  const { isAuthenticated, isRoot, admin, clearAuth, hydrate } = useAdminStore()
  const [hydrated, setHydrated] = useState(false)
  const [tab, setTab]           = useState<Tab>('reservations')
  const [trigger, setTrigger]   = useState(0)

  useEffect(() => { hydrate(); setHydrated(true) }, [hydrate])

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--void)' }}>
      <p className="font-mono text-xs text-red-900 tracking-widest animate-pulse">LOADING...</p>
    </div>
  )

  if (!isAuthenticated) return <LoginScreen onLogin={() => setTrigger(t => t+1)}/>

  const TABS: { id: Tab; label: string; Icon: typeof Calendar }[] = [
    { id:'reservations', label:'Брони',         Icon: Calendar },
    { id:'reviews',      label:'Отзывы',         Icon: MessageSquare },
    { id:'settings',     label:'Настройки',      Icon: Settings },
    ...(isRoot ? [{ id:'users' as Tab, label:'Администраторы', Icon: Users }] : []),
  ]

  return (
    <div className="min-h-screen" style={{ background:'var(--void)' }}>
      {/* Header */}
      <header className="border-b border-red-900/30 sticky top-0 z-40 bg-void-surface/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skull className="w-5 h-5 text-red-700 flex-shrink-0"/>
            <div>
              <p className="font-display text-xs text-bone tracking-widest">ADMIN PANEL</p>
              <p className="font-mono text-[9px] text-red-900">{admin?.username} {isRoot && '· ROOT'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-ghost text-[10px] py-1.5 px-3">← Сайт</a>
            <button onClick={() => { clearAuth(); window.location.href = '/admin' }}
              className="btn-ghost text-[10px] py-1.5 px-3 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5"/> Выйти
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest border-b-2 transition-all ${
                tab === id
                  ? 'border-crimson text-crimson'
                  : 'border-transparent text-bone-dark/60 hover:text-bone'}`}>
              <Icon className="w-3.5 h-3.5"/> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-8">
        {tab === 'reservations' && <ReservationsTab />}
        {tab === 'reviews'      && <ReviewsTab />}
        {tab === 'settings'     && <SettingsTab />}
        {tab === 'users' && isRoot && <UsersTab />}
      </main>
    </div>
  )
}

/* ── Reservations Tab ────────────────────────────────────── */
function ReservationsTab() {
  const [selectedDate, setSelDate] = useState(new Date())
  const [grid, setGrid]            = useState<AvailabilityGrid | null>(null)
  const [loading, setLoading]      = useState(true)
  const [mode, setMode]            = useState<'cinema' | 'quest'>('cinema')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = mode === 'cinema'
        ? await availabilityApi.getGrid(format(selectedDate, 'yyyy-MM-dd'))
        : await questApi.getGrid(format(selectedDate, 'yyyy-MM-dd'))
      setGrid(res.data.data)
    } catch { toast.error('Не удалось загрузить расписание') }
    finally { setLoading(false) }
  }, [selectedDate, mode])

  useEffect(() => { load() }, [load])

  const handleToggle = async (timeSlotId: number, date: string) => {
    try {
      const res = await adminApi.toggleSlot(timeSlotId, date)
      toast.success(res.data.data ? '🔴 Слот занят' : '🟢 Слот свободен')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-sm text-bone tracking-widest">УПРАВЛЕНИЕ РАСПИСАНИЕМ</h2>
        <p className="font-body text-xs text-bone-dark/50">Нажмите на слот чтобы сделать занятым / свободным</p>
      </div>

      {/* Cinema / Quest toggle */}
      <div className="flex gap-1 mb-6 border border-white/8 rounded-lg p-1 w-fit">
        {(['cinema', 'quest'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-md font-mono text-[10px] tracking-widest uppercase transition-all ${
              mode === m
                ? 'bg-red-950/60 text-red-400 border border-red-900/50'
                : 'text-bone-dark/50 hover:text-bone'
            }`}
          >
            {m === 'cinema' ? '🎬 Кино' : '💀 Квест'}
          </button>
        ))}
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setSelDate(d => subDays(d,1))} className="btn-ghost p-2" style={{ minWidth:44, minHeight:44 }}>
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <div className="flex-1 text-center border border-crimson/30 rounded-lg py-3 px-4"
          style={{ background:'rgba(220,20,60,0.06)', maxWidth:320 }}>
          <p className="font-display text-sm text-bone tracking-wider">
            {format(selectedDate,'d MMMM yyyy')}
          </p>
        </div>
        <button onClick={() => setSelDate(d => addDays(d,1))} className="btn-ghost p-2" style={{ minWidth:44, minHeight:44 }}>
          <ChevronRight className="w-4 h-4"/>
        </button>
        <button onClick={load} className="btn-ghost p-2" style={{ minWidth:44, minHeight:44 }} title="Обновить">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {[0,1,2].map(i => <div key={i} className="skeleton h-64 rounded-xl"/>)}
        </div>
      ) : grid ? (
        <ReservationGrid grid={grid} lang="ru" whatsappNumber="" onAdminToggle={handleToggle}/>
      ) : null}

      <div className="flex items-center gap-6 mt-8 pt-6 flex-wrap" style={{ borderTop:'1px solid rgba(139,0,0,0.2)' }}>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded slot-available border"/><span className="font-mono text-[10px] text-bone-dark/70">СВОБОДНО — нажмите чтобы занять</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded slot-reserved border"/><span className="font-mono text-[10px] text-bone-dark/70">ЗАНЯТО — нажмите чтобы освободить</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded slot-passed border"/><span className="font-mono text-[10px] text-bone-dark/70">ПРОШЁЛ</span></div>
      </div>
    </div>
  )
}

/* ── Reviews Tab ─────────────────────────────────────────── */
function ReviewsTab() {
  const [venue, setVenue]     = useState<'CINEMA' | 'QUEST'>('CINEMA')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await reviewApi.getAll(venue); setReviews(r.data.data) }
    catch { toast.error('Ошибка загрузки') }
    finally { setLoading(false) }
  }, [venue])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот отзыв?')) return
    try { await reviewApi.delete(id); toast.success('Удалено'); await load() }
    catch { toast.error('Ошибка') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-sm text-bone tracking-widest">УПРАВЛЕНИЕ ОТЗЫВАМИ</h2>
        <button onClick={load} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5"/> Обновить
        </button>
      </div>

      {/* Cinema / Quest toggle */}
      <div className="flex gap-1 mb-6 border border-white/8 rounded-lg p-1 w-fit">
        {(['CINEMA', 'QUEST'] as const).map(v => (
          <button key={v} onClick={() => setVenue(v)}
            className={`px-5 py-2 rounded-md font-mono text-[10px] tracking-widest uppercase transition-all ${
              venue === v ? 'bg-red-950/60 text-red-400 border border-red-900/50' : 'text-bone-dark/50 hover:text-bone'
            }`}>
            {v === 'CINEMA' ? '🎬 Кино' : '💀 Квест'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-center font-mono text-xs text-bone-dark/40 tracking-widest py-16">НЕТ ОТЗЫВОВ</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="border border-white/8 bg-black/30 rounded-xl px-4 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-bone">{r.name || 'Аноним'}</span>
                  <span className="font-mono text-[10px] text-bone-dark/40">#{r.id}</span>
                  <span className="font-mono text-[10px] text-amber-500">{'★'.repeat(r.stars)}{'☆'.repeat(5-r.stars)}</span>
                  <span className="font-mono text-[9px] text-bone-dark/30">{new Date(r.createdAt).toLocaleString('ru-RU')}</span>
                </div>
                <p className="font-body text-sm text-bone-dark/80 leading-relaxed">{r.body}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-red-800 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Settings Tab ────────────────────────────────────────── */
function SettingsTab() {
  const [venue, setVenue] = useState<'cinema' | 'quest'>('cinema')

  // Cinema settings
  const [waNumber, setWaNumber]   = useState('')
  const [youtubeUrl, setYtUrl]    = useState('')
  const [youtubeUrl2, setYtUrl2]  = useState('')
  const [youtubeUrl3, setYtUrl3]  = useState('')
  const [heroBg, setHeroBg]       = useState('')
  // Quest settings
  const [qWaNumber, setQWaNumber] = useState('')
  const [qYtUrl, setQYtUrl]       = useState('')
  const [qHeroBg, setQHeroBg]     = useState('')

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    adminApi.getSettings().then(r => {
      const d = r.data.data
      setWaNumber(d.whatsapp_number || '')
      setYtUrl(d.youtube_url || '')
      setYtUrl2(d.youtube_url_2 || '')
      setYtUrl3(d.youtube_url_3 || '')
      setHeroBg(d.hero_bg || '')
      setQWaNumber(d.quest_whatsapp_number || '')
      setQYtUrl(d.quest_youtube_url || '')
      setQHeroBg(d.quest_hero_bg || '')
    }).catch(() => toast.error('Ошибка загрузки'))
    .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings({
        whatsapp_number: waNumber, youtube_url: youtubeUrl, youtube_url_2: youtubeUrl2, youtube_url_3: youtubeUrl3, hero_bg: heroBg,
        quest_whatsapp_number: qWaNumber, quest_youtube_url: qYtUrl, quest_hero_bg: qHeroBg,
      })
      toast.success('Настройки сохранены')
    } catch { toast.error('Ошибка сохранения') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="skeleton h-64 rounded-xl"/>

  const isCinema = venue === 'cinema'

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-sm text-bone tracking-widest mb-6">НАСТРОЙКИ САЙТА</h2>

      {/* Cinema / Quest toggle */}
      <div className="flex gap-1 mb-8 border border-white/8 rounded-lg p-1 w-fit">
        {(['cinema', 'quest'] as const).map(v => (
          <button key={v} onClick={() => setVenue(v)}
            className={`px-5 py-2 rounded-md font-mono text-[10px] tracking-widest uppercase transition-all ${
              venue === v ? 'bg-red-950/60 text-red-400 border border-red-900/50' : 'text-bone-dark/50 hover:text-bone'
            }`}>
            {v === 'cinema' ? '🎬 Кино' : '💀 Квест'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-2">
            НОМЕР WHATSAPP
            <span className="text-bone-dark/50 ml-2 normal-case">(без +, пример: 77005767848)</span>
          </label>
          <input className="horror-input w-full font-mono" placeholder="77005767848"
            value={isCinema ? waNumber : qWaNumber}
            onChange={e => isCinema ? setWaNumber(e.target.value) : setQWaNumber(e.target.value)}/>
          <p className="font-mono text-[9px] text-bone-dark/40 mt-1 tracking-wider">
            Предпросмотр: wa.me/{(isCinema ? waNumber : qWaNumber) || '—'}
          </p>
        </div>

        <div>
          <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-2">
            ССЫЛКА НА ТРЕЙЛЕР 1 (YouTube)
          </label>
          <input className="horror-input w-full" placeholder="https://youtu.be/..."
            value={isCinema ? youtubeUrl : qYtUrl}
            onChange={e => isCinema ? setYtUrl(e.target.value) : setQYtUrl(e.target.value)}/>
          <p className="font-mono text-[9px] text-bone-dark/40 mt-1 tracking-wider">
            Поддерживается youtu.be/... и youtube.com/watch?v=...
          </p>
        </div>

        {isCinema && (
          <div>
            <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-2">
              ССЫЛКА НА ТРЕЙЛЕР 2 (YouTube)
            </label>
            <input className="horror-input w-full" placeholder="https://youtu.be/..."
              value={youtubeUrl2}
              onChange={e => setYtUrl2(e.target.value)}/>
            <p className="font-mono text-[9px] text-bone-dark/40 mt-1 tracking-wider">
              Второй трейлер отображается под первым. Оставьте пустым, если не нужен.
            </p>
          </div>
        )}

        {isCinema && (
          <div>
            <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-2">
              ССЫЛКА НА ТРЕЙЛЕР 3 — ЭМОЦИИ ПОСЛЕ СЕАНСА (YouTube, вертикальный 9:16)
            </label>
            <input className="horror-input w-full" placeholder="https://youtu.be/..."
              value={youtubeUrl3}
              onChange={e => setYtUrl3(e.target.value)}/>
            <p className="font-mono text-[9px] text-bone-dark/40 mt-1 tracking-wider">
              Вертикальный трейлер 9:16. Отображается между первым трейлером и кнопками навигации. Оставьте пустым, если не нужен.
            </p>
          </div>
        )}

        <div>
          <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-2">
            ФОН ГЛАВНОГО ЭКРАНА
          </label>
          <div className="space-y-3">
            <input className="horror-input w-full" placeholder="1 — 9, YouTube ссылка, или прямая ссылка на фото"
              value={isCinema ? heroBg : qHeroBg}
              onChange={e => isCinema ? setHeroBg(e.target.value) : setQHeroBg(e.target.value)}/>
            {(() => { const bg = isCinema ? heroBg : qHeroBg; return bg && bg.startsWith('http') && (
              <div className="relative border border-red-900/30 rounded-lg overflow-hidden bg-black h-32">
                <img src={bg} alt="preview" className="w-full h-full object-cover"/>
              </div>
            )})()}
          </div>
          <div className="font-mono text-[9px] text-bone-dark/40 mt-2 tracking-wider space-y-0.5">
            <p>• Цифра (1–9) → использует фото /backgrounds/1.jpg ... /backgrounds/9.jpg</p>
            <p>• YouTube ссылка → автоматически берёт превью видео как фон</p>
            <p>• Прямая ссылка на фото → используется как есть</p>
            <p>• Пусто → стандартный тёмный фон</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="btn-blood flex items-center gap-2 px-6">
          {saving ? <span className="animate-pulse">СОХРАНЕНИЕ...</span>
            : <><Save className="w-4 h-4"/> Сохранить</>}
        </button>
      </div>
    </div>
  )
}

/* ── Users Tab (root only) ───────────────────────────────── */
function UsersTab() {
  const { admin: currentAdmin } = useAdminStore()
  const [admins, setAdmins]     = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [newUser, setNewUser]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await adminApi.getAdmins(); setAdmins(r.data.data) }
    catch { toast.error('Ошибка загрузки') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newUser || !newPass) { toast.error('Заполните поля'); return }
    if (newPass.length < 8) { toast.error('Пароль минимум 8 символов'); return }
    setCreating(true)
    try {
      await adminApi.createAdmin(newUser, newPass)
      toast.success(`Администратор "${newUser}" создан`)
      setNewUser(''); setNewPass('')
      await load()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Ошибка') }
    finally { setCreating(false) }
  }

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Удалить администратора "${username}"?`)) return
    try {
      await adminApi.deleteAdmin(id)
      toast.success('Удалено')
      await load()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Ошибка') }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-sm text-bone tracking-widest mb-8">УПРАВЛЕНИЕ АДМИНИСТРАТОРАМИ</h2>

      {/* Create form */}
      <div className="border border-crimson/25 bg-red-950/10 rounded-xl p-5 mb-8">
        <p className="font-mono text-[10px] text-red-800 tracking-widest mb-4">ДОБАВИТЬ АДМИНИСТРАТОРА</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="horror-input text-sm" placeholder="Username" value={newUser}
            onChange={e => setNewUser(e.target.value)}/>
          <input type="password" className="horror-input text-sm" placeholder="Password (min 8 symbols)"
            value={newPass} onChange={e => setNewPass(e.target.value)}/>
        </div>
        <button onClick={handleCreate} disabled={creating}
          className="btn-blood text-sm flex items-center gap-2 px-5">
          {creating ? <span className="animate-pulse">СОЗДАНИЕ...</span>
            : <><Plus className="w-4 h-4"/> Создать</>}
        </button>
      </div>

      {/* Admin list */}
      {loading ? (
        <div className="space-y-3">{[0,1].map(i=><div key={i} className="skeleton h-14 rounded-xl"/>)}</div>
      ) : (
        <div className="space-y-2">
          {admins.map(a => (
            <div key={a.id}
              className="border border-white/8 bg-black/30 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-bone">{a.username}</span>
                  {a.root && (
                    <span className="font-mono text-[9px] text-red-500 border border-red-800/50 bg-red-950/30 px-1.5 py-0.5 rounded tracking-widest">ROOT</span>
                  )}
                  {a.username === currentAdmin?.username && (
                    <span className="font-mono text-[9px] text-green-500 border border-green-800/50 bg-green-950/30 px-1.5 py-0.5 rounded tracking-widest">ВЫ</span>
                  )}
                </div>
                <p className="font-mono text-[9px] text-bone-dark/40 mt-0.5">
                  {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {!a.root && a.username !== currentAdmin?.username && (
                <button onClick={() => handleDelete(a.id, a.username)}
                  className="text-red-800 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4"/>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

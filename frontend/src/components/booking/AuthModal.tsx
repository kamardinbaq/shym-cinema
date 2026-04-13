'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { X, Skull, User, Lock, Phone } from 'lucide-react'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ onClose, onSuccess }: Props) {
  const { setAuth } = useAuthStore()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [loading, setLoading]   = useState(false)

  // Login fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [phone, setPhone]       = useState('+7 ')
  const [regPass, setRegPass]   = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val.startsWith('+7')) { setPhone('+7 '); return }
    const digits = val.slice(2).replace(/\D/g, '').slice(0, 10)
    let formatted = '+7'
    if (digits.length > 0) formatted += ' ' + digits.slice(0, 3)
    if (digits.length > 3) formatted += ' ' + digits.slice(3, 6)
    if (digits.length > 6) formatted += ' ' + digits.slice(6, 10)
    setPhone(formatted)
  }

  const handleLogin = async () => {
    if (!username || !password) { toast.error('Заполните все поля'); return }
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      setAuth(res.data.data)
      toast.success(`С возвращением, ${res.data.data.username}`)
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Неверные данные')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    const rawPhone = phone.replace(/\s/g, '')
    if (!username || !regPass || !rawPhone || rawPhone.length < 10) {
      toast.error('Заполните все поля')
      return
    }
    if (regPass.length < 8) { toast.error('Пароль минимум 8 символов'); return }
    setLoading(true)
    try {
      const res = await authApi.register({ username, password: regPass, phone: rawPhone })
      setAuth(res.data.data)
      toast.success('Аккаунт создан')
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson/15 border border-crimson/60 flex items-center justify-center">
              <Skull className="w-5 h-5 text-crimson" />
            </div>
            <div>
              <h2 className="font-display text-sm text-bone tracking-wider">
                DARK CINEMA
              </h2>
              <p className="font-mono text-[10px] text-red-800 tracking-widest mt-0.5">
                {mode === 'login' ? 'ВОЙДИТЕ В АККАУНТ' : 'СОЗДАЙТЕ АККАУНТ'}
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

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-lg border border-white/10 bg-black/40">
          <button
            onClick={() => setMode('login')}
            className={`font-display text-[11px] tracking-widest uppercase py-2.5 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-crimson/20 border border-crimson/60 text-white shadow-[inset_0_0_18px_rgba(220,20,60,0.2)]'
                : 'border border-transparent text-bone-dark/60 hover:text-bone'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode('register')}
            className={`font-display text-[11px] tracking-widest uppercase py-2.5 rounded-md transition-all ${
              mode === 'register'
                ? 'bg-crimson/20 border border-crimson/60 text-white shadow-[inset_0_0_18px_rgba(220,20,60,0.2)]'
                : 'border border-transparent text-bone-dark/60 hover:text-bone'
            }`}
          >
            Регистрация
          </button>
        </div>

        {mode === 'login' ? (
          <div className="space-y-3 animate-fade-in">
            <Field label="ИМЯ ПОЛЬЗОВАТЕЛЯ" icon={<User className="w-3.5 h-3.5" />}>
              <input
                className="horror-input"
                placeholder="survivor_name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="username"
              />
            </Field>
            <Field label="ПАРОЛЬ" icon={<Lock className="w-3.5 h-3.5" />}>
              <input
                type="password"
                className="horror-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
            </Field>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-blood w-full mt-3"
            >
              {loading ? <span className="animate-pulse">ВХОД...</span> : 'ВОЙТИ'}
            </button>
            <p className="font-body text-xs text-center text-bone-dark/60 mt-3">
              Нет аккаунта?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-crimson hover:text-red-400 underline font-semibold"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <Field label="ИМЯ ПОЛЬЗОВАТЕЛЯ *" icon={<User className="w-3.5 h-3.5" />}>
              <input
                className="horror-input"
                placeholder="survivor_name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Field>
            <Field label="ТЕЛЕФОН *" icon={<Phone className="w-3.5 h-3.5" />}>
              <input
                className="horror-input"
                placeholder="+7 771 644 3144"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="tel"
                maxLength={15}
                autoComplete="tel"
              />
            </Field>
            <Field label="ПАРОЛЬ *" icon={<Lock className="w-3.5 h-3.5" />}>
              <input
                type="password"
                className="horror-input"
                placeholder="минимум 8 символов"
                value={regPass}
                onChange={e => setRegPass(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn-blood w-full mt-3"
            >
              {loading ? <span className="animate-pulse">СОЗДАНИЕ...</span> : 'СОЗДАТЬ АККАУНТ'}
            </button>
            <p className="font-body text-xs text-center text-bone-dark/60 mt-3">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-crimson hover:text-red-400 underline font-semibold"
              >
                Войти
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label, icon, children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="font-mono text-[10px] text-bone-dark/70 tracking-widest flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-crimson/70">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { X, Skull } from 'lucide-react'

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
  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
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
    if (!username || !password) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      setAuth(res.data.data)
      toast.success(`Welcome back, ${res.data.data.username}`)
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!username || !email || !regPass) { toast.error('Fill in required fields'); return }
    setLoading(true)
    try {
      const res = await authApi.register({ username, email, password: regPass, fullName, phone: phone.replace(/\s/g, '') || undefined })
      setAuth(res.data.data)
      toast.success('Account created!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-700" />
            <div>
              <h2 className="font-display text-xs text-bone tracking-widest">
                {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </h2>
              <p className="font-mono text-[10px] text-red-900 tracking-widest">
                {mode === 'login' ? 'WELCOME BACK, SURVIVOR' : 'JOIN THE DOOMED'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-900 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'login' ? (
          <div className="space-y-4">
            <Field label="USERNAME">
              <input
                className="horror-input"
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </Field>
            <Field label="PASSWORD">
              <input
                type="password"
                className="horror-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </Field>
            <button onClick={handleLogin} disabled={loading} className="btn-blood w-full mt-2">
              {loading ? <span className="animate-pulse">ENTERING...</span> : 'ENTER'}
            </button>
            <p className="font-mono text-xs text-center text-red-900/70 mt-4">
              No account?{' '}
              <button onClick={() => setMode('register')} className="text-red-600 hover:text-red-400 underline">
                Register
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="USERNAME *">
              <input className="horror-input" placeholder="survivor_name" value={username}
                onChange={e => setUsername(e.target.value)} />
            </Field>
            <Field label="EMAIL *">
              <input type="email" className="horror-input" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="PASSWORD *">
              <input type="password" className="horror-input" placeholder="Min 8 chars, upper+lower+digit"
                value={regPass} onChange={e => setRegPass(e.target.value)} />
            </Field>
            <Field label="FULL NAME">
              <input className="horror-input" placeholder="Optional" value={fullName}
                onChange={e => setFullName(e.target.value)} />
            </Field>
            <Field label="PHONE">
              <input
                className="horror-input"
                placeholder="+7 771 644 3144"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="tel"
                maxLength={15}
              />
            </Field>
            <button onClick={handleRegister} disabled={loading} className="btn-blood w-full mt-2">
              {loading ? <span className="animate-pulse">CREATING...</span> : 'CREATE ACCOUNT'}
            </button>
            <p className="font-mono text-xs text-center text-red-900/70 mt-3">
              Have an account?{' '}
              <button onClick={() => setMode('login')} className="text-red-600 hover:text-red-400 underline">
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

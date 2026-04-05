'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { adminApi, authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { Reservation } from '@/types'
import { Skull, Trash2, RefreshCw, Shield, LogOut } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'text-green-400',
  PENDING:   'text-amber-400',
  CANCELLED: 'text-red-700 opacity-50',
  EXPIRED:   'text-gray-600 opacity-50',
}

export default function AdminPage() {
  const { isAdmin, isAuthenticated, user, clearAuth, hydrate, setAuth } = useAuthStore()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading]           = useState(true)
  const [dateFilter, setDateFilter]     = useState('')
  const [cancelling, setCancelling]     = useState<number | null>(null)
  const [hydrated, setHydrated]         = useState(false)

  // Login form state
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading]   = useState(false)

  useEffect(() => { hydrate(); setHydrated(true) }, [hydrate])

  useEffect(() => {
    if (isAuthenticated && isAdmin) load()
  }, [isAuthenticated, isAdmin])

  const load = async () => {
    setLoading(true)
    try {
      const params = dateFilter ? { date: dateFilter } : undefined
      const res = await adminApi.getReservations(params)
      setReservations(res.data.data)
    } catch {
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel reservation #' + id + '?')) return
    setCancelling(id)
    try {
      await adminApi.cancelReservation(id)
      toast.success('Cancelled')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setCancelling(null)
    }
  }

  const handleAdminLogin = async () => {
    if (!loginUsername || !loginPassword) { toast.error('Fill in all fields'); return }
    setLoginLoading(true)
    try {
      const res = await authApi.login(loginUsername, loginPassword)
      const data = res.data.data
      if (data.role !== 'ADMIN') {
        toast.error('Admin credentials required')
        return
      }
      setAuth(data)
      toast.success(`Welcome, ${data.username}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoginLoading(false)
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--void)' }}>
        <p className="font-mono text-xs text-red-900 tracking-widest animate-pulse">LOADING...</p>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--void)' }}>
        <div className="w-full max-w-sm px-4">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-red-900 mx-auto mb-4" />
            <p className="font-display text-xs text-red-800 tracking-widest">ADMIN ACCESS</p>
            <p className="font-body text-bone-dark/60 text-sm mt-2">Sign in with admin credentials.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-1.5">USERNAME</label>
              <input
                className="horror-input w-full"
                placeholder="admin"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-red-800 tracking-widest block mb-1.5">PASSWORD</label>
              <input
                type="password"
                className="horror-input w-full"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <button onClick={handleAdminLogin} disabled={loginLoading} className="btn-blood w-full">
              {loginLoading ? <span className="animate-pulse">ENTERING...</span> : 'ENTER'}
            </button>
            <a href="/" className="btn-ghost w-full text-center block text-xs py-2 px-4">← Back to Site</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--void)' }}>
      {/* Header */}
      <header className="border-b border-red-900/30 bg-void-surface/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="w-6 h-6 text-red-700" />
            <div>
              <h1 className="font-display text-sm text-bone tracking-widest">ADMIN PANEL</h1>
              <p className="font-mono text-[10px] text-red-900">HORROR CINEMA MANAGEMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="btn-ghost text-xs py-2 px-3">← Public Site</a>
            <span className="font-mono text-xs text-red-800">{user?.username}</span>
            <button onClick={() => { clearAuth(); window.location.href = '/' }}
              className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TOTAL',     val: reservations.length,                             color: 'text-bone' },
            { label: 'CONFIRMED', val: reservations.filter(r => r.status === 'CONFIRMED').length, color: 'text-green-400' },
            { label: 'PENDING',   val: reservations.filter(r => r.status === 'PENDING').length,   color: 'text-amber-400' },
            { label: 'CANCELLED', val: reservations.filter(r => r.status === 'CANCELLED').length, color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="border border-red-900/20 bg-void-surface px-4 py-3 text-center">
              <p className={clsx('font-display text-2xl', s.color)}>{s.val}</p>
              <p className="font-mono text-[10px] text-red-900 tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            type="date"
            className="horror-input w-44 font-mono text-sm"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <button onClick={load} className="btn-blood py-2 px-4 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {dateFilter ? 'Filter' : 'Refresh'}
          </button>
          {dateFilter && (
            <button onClick={() => { setDateFilter(''); setTimeout(load, 50) }}
              className="btn-ghost py-2 px-3 text-xs">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="font-mono text-xs text-red-900 text-center py-24 animate-pulse tracking-widest">
            LOADING...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-red-900/30">
                  {['ID', 'USER', 'ROOM', 'DATE', 'TIME', 'PEOPLE', 'STATUS', 'PAYMENT', 'ACTIONS'].map(h => (
                    <th key={h} className="text-left px-3 py-3 font-mono text-[10px] text-red-900 tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 font-mono text-xs text-red-900/40 tracking-widest">
                    NO RESERVATIONS FOUND
                  </td></tr>
                ) : reservations.map((r, i) => (
                  <tr key={r.id}
                    className={clsx('border-b border-red-950/20 transition-colors hover:bg-red-950/5',
                      i % 2 === 0 ? 'bg-white/[0.005]' : '')}>
                    <td className="px-3 py-3 font-mono text-xs text-red-800">#{r.id}</td>
                    <td className="px-3 py-3 font-body text-bone-dark text-xs">{r.username}</td>
                    <td className="px-3 py-3 font-body text-bone text-xs max-w-[120px] truncate">{r.roomName}</td>
                    <td className="px-3 py-3 font-mono text-xs text-bone-dark">{r.reservationDate}</td>
                    <td className="px-3 py-3 font-mono text-xs text-red-800">{r.startTime}–{r.endTime}</td>
                    <td className="px-3 py-3 font-mono text-xs text-bone-dark text-center">{r.peopleCount}</td>
                    <td className="px-3 py-3">
                      <span className={clsx('font-mono text-[10px] tracking-widest', STATUS_COLOR[r.status])}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px]">
                      {r.payment ? (
                        <span className={r.payment.status === 'SUCCESS' ? 'text-green-600' : 'text-red-700'}>
                          {r.payment.status}
                          {r.payment.amount ? ` · ${Number(r.payment.amount).toLocaleString()} ₸` : ''}
                        </span>
                      ) : (
                        <span className="text-red-900/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancelling === r.id}
                          className="text-red-800 hover:text-red-500 transition-colors"
                          title="Cancel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

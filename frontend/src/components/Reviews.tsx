'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { reviewApi } from '@/lib/api'
import { useAdminStore } from '@/lib/store'
import type { Review, Language } from '@/types'
import { Star, Trash2, Send, User } from 'lucide-react'

const T = {
  ru: { title:'ОТЗЫВЫ', leaveReview:'Оставить отзыв', name:'Ваше имя (необязательно)',
        review:'Ваш отзыв...', submit:'Отправить', noReviews:'Пока нет отзывов — будьте первым!',
        anonymous:'Аноним', deleteConfirm:'Удалить этот отзыв?' },
  kz: { title:'ПІКІРЛЕР', leaveReview:'Пікір қалдыру', name:'Атыңыз (міндетті емес)',
        review:'Пікіріңіз...', submit:'Жіберу', noReviews:'Әлі пікір жоқ — бірінші болыңыз!',
        anonymous:'Аноним', deleteConfirm:'Бұл пікірді жою керек пе?' },
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={String(n)}
          aria-pressed={value === n}
          className="rating-star text-2xl transition-transform hover:scale-110 active:scale-95"
          style={{ color: n <= (hovered || value) ? '#f59e0b' : 'rgba(200,180,160,0.2)' }}>
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review, onDelete, lang }: { review: Review; onDelete?: () => void; lang: Language }) {
  const t = T[lang]
  return (
    <div className="review-card px-5 py-5 flex flex-col gap-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {[1,2,3,4,5].map(n => (
              <span key={n} className="text-sm" style={{ color: n <= review.stars ? '#f59e0b' : 'rgba(200,180,160,0.15)' }}>★</span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-red-800 tracking-widest flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            {review.name || t.anonymous}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[9px] text-bone-dark/30">
            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
          </span>
          {onDelete && (
            <button onClick={onDelete} aria-label={t.deleteConfirm} className="review-delete text-bone-dark/30 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="font-body text-sm text-bone-dark leading-relaxed">{review.body}</p>
    </div>
  )
}

export default function Reviews({ lang, venue = 'CINEMA', initialReviews }: { lang: Language; venue?: 'CINEMA' | 'QUEST'; initialReviews?: Review[] }) {
  const t = T[lang]
  const { isAuthenticated } = useAdminStore()
  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [loading, setLoading] = useState(initialReviews === undefined)
  const [name, setName]       = useState('')
  const [body, setBody]       = useState('')
  const [stars, setStars]     = useState(5)
  const [sending, setSending] = useState(false)

  const load = async () => {
    try { const r = await reviewApi.getAll(venue); setReviews(r.data.data) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (initialReviews === undefined) {
      load()
    }
  }, [venue, initialReviews])

  const handleSubmit = async () => {
    if (!body.trim()) { toast.error(lang === 'kz' ? 'Пікір жазыңыз' : 'Напишите отзыв'); return }
    setSending(true)
    try {
      await reviewApi.create({ name: name.trim() || undefined, stars, body: body.trim(), venue })
      toast.success(lang === 'kz' ? 'Пікір жіберілді!' : 'Отзыв отправлен!')
      setName(''); setBody(''); setStars(5)
      await load()
    } catch { toast.error(lang === 'kz' ? 'Қате орын алды' : 'Ошибка. Попробуйте снова') }
    finally { setSending(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t.deleteConfirm)) return
    try { await reviewApi.delete(id); toast.success('Удалено'); await load() }
    catch { toast.error('Ошибка') }
  }

  return (
    <div className="reviews-layout">
      {/* Review form */}
      <div className="review-form p-5 sm:p-7">
        <p className="font-mono text-[10px] text-red-800 tracking-widest mb-4">{t.leaveReview.toUpperCase()}</p>
        <div className="space-y-4">
          <StarRating value={stars} onChange={setStars} />
          <input className="horror-input text-sm" placeholder={t.name}
            value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          <textarea className="horror-input resize-none h-24 text-sm" placeholder={t.review}
            value={body} onChange={e => setBody(e.target.value)} maxLength={1000} />
          <button onClick={handleSubmit} disabled={sending}
            className="btn-blood flex items-center gap-2 text-sm px-6">
            {sending ? <span className="animate-pulse">{lang === 'kz' ? 'Жіберілуде...' : 'Отправка...'}</span>
              : <><Send className="w-4 h-4" /> {t.submit}</>}
          </button>
        </div>
      </div>

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="skeleton h-24 rounded-xl"/>)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-center font-mono text-xs text-bone-dark/40 tracking-widest py-10">{t.noReviews}</p>
      ) : (
        <div className="review-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} lang={lang}
              onDelete={isAuthenticated ? () => handleDelete(r.id) : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}

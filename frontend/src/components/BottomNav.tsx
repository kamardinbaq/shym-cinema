'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Skull } from 'lucide-react'

const TABS = [
  { href: '/',      labelRu: 'КИНО',  labelKz: 'КИНО',  icon: Film  },
  { href: '/quest', labelRu: 'КВЕСТ', labelKz: 'КВЕСТ', icon: Skull },
]

export default function BottomNav({ lang = 'ru' }: { lang?: 'ru' | 'kz' }) {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#000',
        borderTop: '2px solid #dc2626',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {TABS.map(({ href, labelRu, labelKz, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 font-mono text-[10px] tracking-widest uppercase transition-all duration-200 ${
                active ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={{ background: active ? 'rgba(139,0,0,0.15)' : 'transparent' }}
            >
              <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(220,20,60,0.8)]' : ''}`} />
              <span>{lang === 'kz' ? labelKz : labelRu}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'DARK CINEMA — Almaty',
  description: 'Бронирование сеансов в Dark Cinema. 4 уровня страха. Almaty.',
  icons: { icon: '/favicon.ico' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#161616',
              color: '#e8dcc8',
              border: '1px solid rgba(139,0,0,0.4)',
              fontFamily: "'Crimson Text', serif",
              fontSize: '1rem',
              maxWidth: '90vw',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#161616' },
            },
            error: {
              iconTheme: { primary: '#dc143c', secondary: '#161616' },
            },
          }}
        />
      </body>
    </html>
  )
}

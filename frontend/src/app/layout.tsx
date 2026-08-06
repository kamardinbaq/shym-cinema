import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'SHYM CINEMA — Shymkent',
  description: 'Бронирование сеансов в Dark Cinema. 4 уровня страха. Shymkent.',
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070506',
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
              background: '#150b0e',
              color: '#f1ebe6',
              border: '1px solid rgba(197,43,64,0.32)',
              borderRadius: '8px',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.9rem',
              maxWidth: '90vw',
            },
            success: { iconTheme: { primary: '#56b47c', secondary: '#150b0e' } },
            error:   { iconTheme: { primary: '#c52b40', secondary: '#150b0e' } },
          }}
        />
      </body>
    </html>
  )
}

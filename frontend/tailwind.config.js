/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      colors: {
        blood:   { DEFAULT: '#8B0000', light: '#cc0000', dark: '#4a0000' },
        bone:    { DEFAULT: '#e8dcc8', dark: '#c4b49a' },
        void:    { DEFAULT: '#0a0a0a', mid: '#111111', surface: '#161616', elevated: '#1c1c1c' },
        crimson: '#dc143c',
        rust:    '#7c3a2d',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        horror:  ['var(--font-horror)', 'cursive'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        flicker:    'flicker 3s infinite',
        'pulse-red':'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        bleed:      'bleed 4s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '1' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 0, 0, 0.7)' },
          '70%':      { boxShadow: '0 0 0 10px rgba(139, 0, 0, 0)' },
        },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        bleed: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

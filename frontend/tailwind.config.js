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
        void:    { DEFAULT: '#050505', mid: '#0c0c0c', surface: '#141418', elevated: '#1c1c22' },
        crimson: '#dc143c',
        rust:    '#7c3a2d',
        purple:  { DEFAULT: '#3a0f3f', light: '#6b1f6e', dark: '#1a051f' },
        ash:     '#8a807a',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        horror:  ['var(--font-horror)', 'cursive'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        flicker:    'flicker 3.5s infinite',
        'pulse-red':'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'float-up': 'float-up 0.5s ease-out both',
        bleed:      'bleed 4s ease-in-out infinite',
        shimmer:    'shimmer 1.8s ease-in-out infinite',
        'fog-drift':'fog-drift 60s ease-in-out infinite alternate',
      },
      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '1' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.45' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 20, 60, 0.65)' },
          '70%':      { boxShadow: '0 0 0 12px rgba(220, 20, 60, 0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(220,20,60,0.35)' },
          '50%':      { boxShadow: '0 0 28px rgba(220,20,60,0.7)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.75' },
          '50%':      { opacity: '1' },
        },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'float-up': {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        bleed: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fog-drift': {
          '0%':   { transform: 'translate(0, 0)' },
          '50%':  { transform: 'translate(-4%, 2%)' },
          '100%': { transform: 'translate(3%, -3%)' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
        'blood-gradient': 'linear-gradient(135deg, #4a0000 0%, #8B0000 55%, #cc0000 100%)',
        'void-gradient':  'linear-gradient(180deg, #141418 0%, #050505 100%)',
      },
    },
  },
  plugins: [],
}

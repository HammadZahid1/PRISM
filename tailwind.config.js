/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        base: '#08090b',
        elevated: '#0b0d10',
        surface: '#101216',
        raised: '#14171c',
        hover: '#1a1d23',
        line: '#232831',
        cyan: {
          DEFAULT: '#22d3ee',
          soft: '#67e8f9',
          dim: '#0e7490',
        },
        ice: '#a5d8ff',
        violet: {
          DEFAULT: '#8b7cf6',
          soft: '#b9aeff',
          dim: '#4c3fa8',
        },
        muted: '#7d8798',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 50px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 0 28px rgba(34,211,238,0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16,1,0.3,1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

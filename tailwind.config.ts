import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: { DEFAULT: '#0a0e14', card: '#10151d', raised: '#161c26', border: '#222a35', border2: '#2e3845' },
        emerald: { DEFAULT: '#10b981', bg: 'rgba(16,185,129,0.08)', ring: 'rgba(16,185,129,0.18)' },
        warn: '#f59e0b',
        loss: '#f87171',
        t1: '#eef1f5', t2: '#8893a3', t3: '#4a5563',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: { glass: '0 8px 32px rgba(0,0,0,0.35)' },
      borderRadius: { '2xl': '20px', '3xl': '28px' },
    },
  },
  plugins: [],
};
export default config;

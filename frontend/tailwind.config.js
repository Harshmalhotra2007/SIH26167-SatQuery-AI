/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SatQuery AI - Warm Human-Centric Palette
        canvas: {
          950: '#0d1117',  // Warmer, grounded dark slate
          900: '#121316',  // App background
          800: '#181a20',  // Soft dark stone cards & panels
          700: '#262930',  // Borders / subtle dividers
          600: '#343842',
        },
        stone: {
          50: '#f6f6f7',
          100: '#e7e7e9',
          200: '#d1d2d6',
          300: '#b0b2b8',
          400: '#8c8e96',  // Text muted
          500: '#6a6c74',
        },
        accent: {
          400: '#fbbf24',  // Warm amber/honey highlight
          500: '#f59e0b',  // Primary interactive amber button
          600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        ui: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'panel': '24px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'panel': '0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(38, 41, 48, 0.6)',
        'elevated': '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 158, 11, 0.2)',
      },
      backgroundImage: {
        'warm-glow': 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

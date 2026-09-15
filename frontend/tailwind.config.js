/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SatQuery AI - Earth observation color system
        space: {
          950: '#050814',  // Deep space background
          900: '#0B1426',  // Earth observation surface
          800: '#111F3A',  // Data layer cards
          700: '#1E3A5F',  // Borders / horizon lines
          600: '#2A4A7A',
          500: '#3B5D8C',
        },
        earth: {
          50: '#E8EDF5',   // Text primary - starlight on clouds
          100: '#D1DCE8',
          200: '#A3B8CC',
          300: '#7A94B8',
          400: '#6B8BA4',  // Text muted - atmospheric haze
          500: '#5A7A94',
        },
        vegetation: {
          400: '#00D4AA',  // Primary - NDVI green, vegetation health
          500: '#00BE9A',
          600: '#00A88A',
        },
        thermal: {
          400: '#FF6B35',  // Accent - thermal IR, fire detection
          500: '#E85D2E',
          600: '#CC5229',
        },
        destructive: {
          500: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        ui: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterWidth: '-0.02em' }],
        'display-lg': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterWidth: '-0.01em' }],
        'display-md': ['clamp(1.25rem, 2.5vw, 1.75rem)', { lineHeight: '1.2' }],
        'display-sm': ['clamp(1.125rem, 2vw, 1.375rem)', { lineHeight: '1.25' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
        'data': ['0.8125rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'card': '12px',
        'panel': '16px',
      },
      boxShadow: {
        'panel': '0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(30, 58, 95, 0.5)',
        'overlay': '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
        'elevated': '0 12px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(30, 58, 95, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(30, 58, 95, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 58, 95, 0.15) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0, 212, 170, 0.08) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

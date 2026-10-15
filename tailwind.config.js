/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFDFC',
          100: '#FAF9F6',
          200: '#F4F2EC',
          300: '#EAE6DC',
          400: '#DDD8CB',
        },
        charcoal: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        forest: {
          900: '#0D281E',
          800: '#16382C',
          700: '#1F4D3C',
          600: '#2A634E',
          500: '#357A60',
          100: '#E3EFE9',
          50: '#F2F7F4',
        },
        burgundy: {
          900: '#4A1521',
          800: '#631D2D',
          700: '#7E263A',
          600: '#9B3248',
          500: '#B83E58',
          100: '#F9E8EC',
          50: '#FCF4F6',
        },
        amber: {
          800: '#78350F',
          700: '#92400E',
          600: '#B45309',
          100: '#FEF3C7',
          50: '#FFFBEB',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"IBM Plex Mono"',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'elevated': '0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.03)',
        'modal': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

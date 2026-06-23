/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10113F',
          50: '#E8E8F0',
          100: '#C5C5D8',
          200: '#9E9EBF',
          300: '#7777A6',
          400: '#57578F',
          500: '#10113F',
          600: '#0D0E36',
          700: '#0A0B2B',
          800: '#070820',
          900: '#040415',
        },
        accent: {
          DEFAULT: '#FAA71A',
          50: '#FEF5E0',
          100: '#FDE6B3',
          200: '#FCD680',
          300: '#FBC64D',
          400: '#FAB927',
          500: '#FAA71A',
          600: '#E89508',
          700: '#C67D06',
          800: '#A46604',
          900: '#824F02',
        },
        danger: '#E94043',
        secondary: '#861630',
        premium: '#4D1B3B',
        surface: '#F8F7F3',
        dark: {
          bg: '#0B1020',
          surface: '#121A2E',
          card: '#1A2540',
          border: '#2A3550',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(16, 17, 63, 0.08), 0 1px 2px -1px rgba(16, 17, 63, 0.06)',
        'card-hover': '0 4px 16px 0 rgba(16, 17, 63, 0.12), 0 2px 6px -1px rgba(16, 17, 63, 0.08)',
        'premium': '0 8px 32px 0 rgba(16, 17, 63, 0.16)',
        'sidebar': '2px 0 16px 0 rgba(0, 0, 0, 0.12)',
        'topbar': '0 1px 0 0 rgba(16, 17, 63, 0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#6c5ce7',
          600: '#5341cd',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        secondary: {
          DEFAULT: '#ff4d6d',
          50: '#fff0f3',
          100: '#ffd6de',
          500: '#ff4d6d',
          600: '#b60e3d'
        },
        tertiary: {
          DEFAULT: '#00b894',
          50: '#dffff1',
          500: '#00b894',
          600: '#006651'
        }
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(108, 92, 231, 0.05), 0 2px 6px -1px rgba(27, 31, 35, 0.04)',
        'card-hover': '0 10px 25px -4px rgba(108, 92, 231, 0.12)'
      }
    }
  },
  plugins: []
}

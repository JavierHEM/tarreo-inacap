/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#6d28d9', // purple-600
          700: '#5b21b6', // purple-700
        },
        background: '#0f172a', // bg-slate-900
      },
      backgroundImage: {
        'gradient-game': 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 25%, #1e40af 50%, #3730a3 75%, #1e1b4b 100%)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
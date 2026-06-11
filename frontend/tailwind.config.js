/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#6b8bad',
          500: '#3d6b99',
          600: '#1a4971',
          700: '#002045',
          800: '#001a38',
          900: '#00132a',
        },
        indigo: {
          400: '#818cf8',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
};

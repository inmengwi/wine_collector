/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f5a9ba',
          400: '#ee7794',
          500: '#e34d72',
          600: '#cf2d5a',
          700: '#ae2049',
          800: '#921d41',
          900: '#722F37', // Primary wine red
          950: '#450c1a',
        },
        gold: {
          50: '#fdfaeb',
          100: '#faf2c9',
          200: '#f5e38f',
          300: '#f0d054',
          400: '#ebbc28',
          500: '#C9A962', // Secondary gold
          600: '#a67c15',
          700: '#855a14',
          800: '#6e4718',
          900: '#5d3b19',
          950: '#361e0a',
        },
        cream: '#FAF8F5',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

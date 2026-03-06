/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#001f3f',
          light: '#003366',
          dark: '#001222',
        },
        orange: {
          DEFAULT: '#ff851b',
          light: '#ffaa5e',
          dark: '#cc6a15',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

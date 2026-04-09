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
        teal: {
          50: '#E1F5EE',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041'
        }
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // التبديل عبر كلاس class في الـ html
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        roseAccent: {
          DEFAULT: '#E1989A',
          hover: '#D4A5A5',
          light: '#FDF6F6',
        },
        darkBg: '#121212',
        darkCard: '#1E1E1E'
      }
    },
  },
  plugins: [],
}
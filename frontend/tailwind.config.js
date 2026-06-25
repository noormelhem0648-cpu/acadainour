/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F6F1E9', // الخلفية العاجية القديمة
        primary: {
          gold: '#A08F5A', // اللون الذهبي القديم
          dark: '#1F1F1F', // اللون الأسود القديم للخط الكوفي
        },
      },
      fontFamily: {
        kufi: ['Noto Kufi Arabic', 'sans-serif'], // الخط الكوفي
      },
    },
  },
  plugins: [],
}
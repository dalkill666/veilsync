/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['"Orbitron"', 'sans-serif'],
        'sans': ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.6)',
        'neon-fuchsia': '0 0 15px rgba(217, 70, 239, 0.6)',
      },
    },
  },
  plugins: [],
}
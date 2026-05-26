/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        card: '#FFFFFF',
        primary: '#0D7377',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6560',
        border: '#E8E2D9',
        overdue: '#EF4444',
        dueToday: '#F59E0B',
        upcoming: '#3B82F6',
      }
    },
  },
  plugins: [],
}

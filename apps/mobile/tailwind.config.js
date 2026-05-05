/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base:      "#0D1117",
        surface:   "#161B22",
        surface2:  "#1C2128",
        amber:     "#F5A623",
        teal:      "#2A9D8F",
        offwhite:  "#F7F3EE",
        text:      "#E6EDF3",
        muted:     "#8B949E",
        danger:    "#F85149",
        success:   "#3FB950",
        warning:   "#E3B341",
      },
    },
  },
  plugins: [],
}

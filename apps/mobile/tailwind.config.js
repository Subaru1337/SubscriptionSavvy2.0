/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base:      "#FAF7F2",
        surface:   "#FFFFFF",
        surface2:  "#EEF7F7",
        amber:     "#0D7377",
        teal:      "#14A085",
        offwhite:  "#F7F3EE",
        text:      "#1A1A1A",
        muted:     "#6B6560",
        danger:    "#E05C5C",
        success:   "#2ECC7A",
        warning:   "#E05C5C",
      },
    },
  },
  plugins: [],
}

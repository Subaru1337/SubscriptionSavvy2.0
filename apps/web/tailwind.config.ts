import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base:      "#0D1117",
        surface:   "#161B22",
        surface2:  "#1C2128",
        border:    "rgba(240,246,252,0.1)",
        amber:     "#F5A623",
        teal:      "#2A9D8F",
        offwhite:  "#F7F3EE",
        text:      "#E6EDF3",
        muted:     "#8B949E",
        danger:    "#F85149",
        success:   "#3FB950",
        warning:   "#E3B341",
        // Extended palette
        "amber-dim":  "#C4841C",
        "teal-dim":   "#1E7268",
        "blue-accent": "#58A6FF",
        "purple-accent": "#BC8CFF",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      fontSize: {
        "display": ["clamp(2.5rem, 8vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.04em", fontWeight: "800" }],
        "headline": ["clamp(1.75rem, 4vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" }],
        "title": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
      },
      borderRadius: {
        "card": "16px",
        "pill": "9999px",
      },
      boxShadow: {
        "card": "0 0 0 1px rgba(240,246,252,0.1)",
        "card-hover": "0 0 0 1px #F5A623",
        "amber-glow": "0 0 24px rgba(245,166,35,0.25)",
        "teal-glow": "0 0 24px rgba(42,157,143,0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "breathe": "breathe 8s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-amber": "pulseAmber 2s ease-in-out infinite",
        "count-up": "countUp 0.8s ease-out forwards",
        "slide-up": "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in": "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseAmber: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,166,35,0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(245,166,35,0.15)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

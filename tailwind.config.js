/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      colors: {
        accent: "#FF3355",
        gold: "#FFB830",
        bg: "#06060e",
      },
      animation: {
        "pulse-dot": "pulse-dot 1.8s ease infinite",
        "eq1": "eq 0.9s ease infinite 0ms",
        "eq2": "eq 0.9s ease infinite 120ms",
        "eq3": "eq 0.9s ease infinite 250ms",
        "eq4": "eq 0.9s ease infinite 70ms",
        "eq5": "eq 0.9s ease infinite 200ms",
        "badge-pulse": "badge-pulse 2s ease infinite",
        "song-in": "song-in 0.38s ease",
        "fade-up": "fade-up 0.35s ease",
        "spin-custom": "spin 0.75s linear infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.7)" },
        },
        eq: {
          "0%,100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "badge-pulse": {
          "0%,100%": { borderColor: "rgba(255,51,85,0.4)" },
          "50%": { borderColor: "rgba(255,51,85,0.9)" },
        },
        "song-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

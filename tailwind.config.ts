import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF6EB",
        sand: "#F6E9D6",
        ink: "#22304F",
        "ink-soft": "#66739B",
        coral: "#FF6B4A",
        "coral-deep": "#D14B2E",
        teal: "#2EC4B6",
        "teal-deep": "#1F9C90",
        sky: "#4CC9F0",
        grape: "#7C5CE0",
        "grape-deep": "#5F41C0",
        sun: "#FFC53D",
        "sun-deep": "#E0A420",
        mint: "#3DDC97",
        "mint-deep": "#27B378",
        rose: "#FF5D8F",
        ocean: "#DFF1FB",
      },
      fontFamily: {
        display: ['"Baloo 2"', "Nunito", "system-ui", "sans-serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 4px 0 0 rgba(34,48,79,0.12)",
        card: "0 2px 0 0 #EFE0CA",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        shake: "shake 0.45s ease-in-out",
        pulseSoft: "pulseSoft 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

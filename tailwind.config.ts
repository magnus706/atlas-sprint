import type { Config } from "tailwindcss";

// Globli brand v2 — clean white surfaces, hairline borders,
// one signature teal, flat accent set. No soft shadows; pressed 3D buttons.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#00B2A9", dark: "#008F88", deep: "#00726C", light: "#D9F4F2", tint: "#EFFBFA" },
        blue: { DEFAULT: "#1CB0F6", dark: "#1899D6", light: "#DDF4FF" },
        purple: { DEFAULT: "#B968F0", dark: "#9A4ED1", light: "#F3E8FC" },
        orange: { DEFAULT: "#FF9600", dark: "#D67E00", light: "#FFF0DC" },
        red: { DEFAULT: "#FF4B4B", dark: "#D63A3A", light: "#FFE5E5" },
        yellow: { DEFAULT: "#FFC800", dark: "#D6A800", light: "#FFF5D6" },
        green: { DEFAULT: "#2EC45E", dark: "#26A04E", light: "#E0F7E8" },
        ink: "#4B4B4B",
        sub: "#8F8F8F",
        line: "#E5E5E5",
        panel: "#F7F7F7",
      },
      fontFamily: {
        display: ["Nunito", "system-ui", "sans-serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        shake: "shake 0.45s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;

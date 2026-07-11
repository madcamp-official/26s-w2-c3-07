import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          950: "#0a0806",
          900: "#120e0a",
          800: "#1d1712",
          700: "#2a221a",
        },
        parchment: {
          100: "#f3e9d2",
          300: "#e8d9b5",
        },
        brass: {
          400: "#d9b26a",
          500: "#c9a45c",
          600: "#a8813f",
        },
        evidence: {
          red: "#b3392f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

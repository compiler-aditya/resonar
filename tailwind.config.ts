import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: "#e9dfc9",
          soft: "#f0e8d5",
          deep: "#dfd3b8",
        },
        cream: {
          DEFAULT: "#faf5ea",
          soft: "#fdf9f0",
        },
        espresso: {
          DEFAULT: "#3d2f28",
          soft: "#5c4a42",
          faint: "#8a7a6e",
        },
        plum: {
          DEFAULT: "#6b4a5c",
          soft: "#8a6478",
          deep: "#4e3342",
          tint: "#e8dfe2",
          mist: "#f0e7ea",
        },
        olive: {
          DEFAULT: "#6a7548",
          soft: "#8b9469",
        },
        sienna: {
          DEFAULT: "#c4704a",
          deep: "#9d5335",
        },
        // emotion chip colors
        rose: {
          DEFAULT: "#b04b5e",
          soft: "#f2d5db",
        },
        amber: {
          DEFAULT: "#a06320",
          soft: "#f2dfb6",
        },
        rust: {
          DEFAULT: "#8b3a2c",
          soft: "#eecac3",
        },
        forest: {
          DEFAULT: "#4a6a4c",
          soft: "#d6e2d3",
        },
        background: "#e9dfc9",
        foreground: "#3d2f28",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "Georgia", "serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        cozy: "0 6px 20px -8px rgba(61, 47, 40, 0.18)",
        "cozy-sm": "0 2px 8px -2px rgba(61, 47, 40, 0.14)",
        "cozy-lg": "0 12px 30px -10px rgba(61, 47, 40, 0.22)",
      },
      borderRadius: {
        cozy: "20px",
      },
    },
  },
  plugins: [],
};
export default config;

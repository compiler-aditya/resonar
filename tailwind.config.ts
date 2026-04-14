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
        paper: {
          DEFAULT: "#f4ecd8",
          soft: "#faf6e8",
          deep: "#ebe1ca",
        },
        ink: {
          DEFAULT: "#1a1815",
          soft: "#3a3530",
          faint: "#6b645a",
        },
        signal: {
          DEFAULT: "#d9571e",
          soft: "#e8754a",
          deep: "#a83f12",
        },
        olive: {
          DEFAULT: "#8b9469",
          soft: "#a7ac85",
        },
        tape: "#c9bfa6",
        // keep background/foreground for legacy utility references
        background: "#f4ecd8",
        foreground: "#1a1815",
      },
      fontFamily: {
        mono: ["var(--font-plex-mono)", "ui-monospace", "Menlo", "monospace"],
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plex-sans)", "Georgia", "serif"],
      },
      letterSpacing: {
        caps: "0.14em",
      },
      boxShadow: {
        tape: "3px 3px 0 0 #1a1815",
        "tape-sm": "2px 2px 0 0 #1a1815",
      },
      borderWidth: {
        ink: "1px",
      },
    },
  },
  plugins: [],
};
export default config;

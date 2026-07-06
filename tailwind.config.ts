import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F2226",
        "bg-panel": "#123330",
        "bg-card": "#1A3D39",
        "bg-card-hover": "#204841",
        accent: "#1FA98A",
        "accent-bright": "#52CBA9",
        "accent-mint": "#8FE0C4",
        "text-dark": "#0F2226",
        "text-light": "#F2FBF8",
        "text-muted": "#84AFA6",
        border: "#28504A",
        danger: "#D9694F",
        warning: "#E8B23D",
        success: "#52CBA9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-barlow)", "Barlow Condensed", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};

export default config;

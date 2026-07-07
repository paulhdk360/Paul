import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F4F7FB",
        "bg-panel": "#FFFFFF",
        "bg-card": "#FFFFFF",
        "bg-sunken": "#EEF2F8",
        navy: "#0B2E6B",
        "navy-dark": "#082153",
        blue: "#1477C6",
        cyan: "#29ABE2",
        accent: "#1477C6",
        "accent-bright": "#0B2E6B",
        "text-dark": "#101828",
        "text-light": "#FFFFFF",
        "text-muted": "#5B6B85",
        border: "#DCE3EF",
        danger: "#D64545",
        warning: "#C98A1E",
        success: "#1C9A6C",
        flag: "#E2231A",
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

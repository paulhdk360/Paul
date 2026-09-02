import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#effaf1",
          100: "#d7f2dc",
          200: "#b1e4bb",
          300: "#7fce8f",
          400: "#4bb163",
          500: "#2c9548",
          600: "#1c7a3e",
          700: "#186235",
          800: "#164e2d",
          900: "#134026",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
    },
  },
  plugins: [],
};

export default config;

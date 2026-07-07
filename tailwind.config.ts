import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Panel ARS (se mantiene).
        brand: {
          DEFAULT: "#0f766e",
          dark: "#115e59",
          light: "#14b8a6",
        },
        // Identidad del portal DestinoPropiedades.com (navy + dorado/arena).
        navy: {
          DEFAULT: "#0f2438",
          light: "#1c3b59",
          deep: "#0a1a29",
        },
        sand: {
          DEFAULT: "#c9a463",
          light: "#e7d6b3",
          dark: "#a9854a",
        },
        cream: "#faf7f2",
        ink: "#1a2733",
        line: "#e7e2d9",
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f5f1ea",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

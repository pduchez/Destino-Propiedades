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
        // Paleta del Asistente de Cierre (alineada con navy/sand del portal).
        marino: {
          DEFAULT: "#0f2743",
          50: "#eef2f7",
          100: "#d5deeb",
          600: "#173a5e",
          700: "#0f2743",
          800: "#0a1c31",
          900: "#061321",
        },
        dorado: {
          DEFAULT: "#c9a227",
          50: "#faf5e3",
          100: "#f3e7bb",
          400: "#d8b23f",
          500: "#c9a227",
          600: "#a5841c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,39,67,0.08), 0 8px 24px rgba(15,39,67,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;

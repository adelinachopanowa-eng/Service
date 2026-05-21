import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1a4a2e",
          dark: "#0f3520",
          light: "#21603b",
          yellow: "#f0c040",
          "yellow-dark": "#e0b030",
        },
        cream: "#f5f4ee",
        bordergray: "#d0d0c8",
        text: "#1a1a1a",
        soft: "#666666",
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.10)",
        topbar: "0 2px 6px rgba(0,0,0,0.25)",
        actionbar: "0 -2px 10px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        card: "10px",
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

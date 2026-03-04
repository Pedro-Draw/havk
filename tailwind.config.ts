import type { Config } from "tailwindcss";

export default {
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: "hsl(var(--background))",
        border: "hsl(var(--foreground) / 0.1)",
      },
    },
  },

  plugins: [],
} satisfies Config;
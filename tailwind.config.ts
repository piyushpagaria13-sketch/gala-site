import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "navy-bg": "var(--navy-bg)",
        "navy-mid": "var(--navy-mid)",
        gold: "var(--gold)",
        "gold-deep": "var(--gold-deep)",
        "gold-pale": "var(--gold-pale)",
        card: "var(--card)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        error: "var(--error)",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
        "card-lg": "24px",
      },
    },
  },
  plugins: [],
};

export default config;

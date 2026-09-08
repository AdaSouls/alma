/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Public Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#F5F7FA",
        "paper-raised": "#FFFFFF",
        ink: "#171B2B",
        "ink-soft": "#576073",
        accent: "#1C9A90",
        "accent-text": "#127D74",
        "accent-soft": "#DCF0EC",
        evidence: "#2F7A4F",
        line: "#DCE1E8",
      },
    },
  },
  plugins: [],
};

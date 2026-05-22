/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        },
        error: "#ef4444",
        success: "#22c55e",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: "#030712",
        panel: "#0f172a",
        neon: "#22d3ee",
        neon2: "#a78bfa",
        accent: "#38bdf8",
        danger: "#fb7185",
        success: "#34d399",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Georgia", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        forest: {
          50: "#f0f7f0",
          100: "#dceedd",
          200: "#badebb",
          300: "#8ec690",
          400: "#5ea863",
          500: "#3d8c42",
          600: "#2d7033",
          700: "#255929",
          800: "#1f4622",
          900: "#193a1c",
        },
        stone: {
          warm: "#f5f0eb",
        },
      },
    },
  },
  plugins: [],
};

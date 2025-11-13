/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
    "./plugins/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7c3aed",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6"
        }
      }
    },
  },
  plugins: [],
}



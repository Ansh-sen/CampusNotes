/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#1a2744',
          secondary: '#334155',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}


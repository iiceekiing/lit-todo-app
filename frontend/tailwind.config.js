/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        litbg: '#fff4d4',
        litblue: '#1f56fe',
        litbluedk: '#1440cc',
        litgreen: '#22c55e',
        litgreendk: '#16a34a',
        litorange: '#f97316',
        lityellow: '#eab308',
        litred: '#ef4444',
        litgray: '#6b7280',
        littext: '#111827',
        litmuted: '#9ca3af',
        litborder: '#e5e7eb',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.10)',
      }
    },
  },
  plugins: [],
}

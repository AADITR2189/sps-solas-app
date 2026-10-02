/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d10',
        surface: '#14171c',
        raised: '#1c2027',
        line: '#262b34',
        muted: '#8b93a1',
        accent: { DEFAULT: '#a3e635', dim: '#4d7c0f', ink: '#0b0d10' },
        cardio: { DEFAULT: '#38bdf8', dim: '#0c4a6e' },
        danger: '#f87171',
        gold: '#facc15',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

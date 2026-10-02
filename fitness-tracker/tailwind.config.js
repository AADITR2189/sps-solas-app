/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        primary: { DEFAULT: v('primary'), ink: v('primary-ink'), hover: v('primary-hover') },
        str: { DEFAULT: v('str'), soft: v('str-soft') },
        car: { DEFAULT: v('car'), soft: v('car-soft') },
        gold: { DEFAULT: v('gold'), soft: v('gold-soft') },
        danger: { DEFAULT: v('danger'), soft: v('danger-soft') },
      },
      fontFamily: {
        sans: ['"Geist Sans"', '"SF Pro Display"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', '"Lyon Text"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '6px',
      },
      boxShadow: {
        lift: '0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

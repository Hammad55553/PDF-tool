import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dfe9ff',
          200: '#c4d6ff',
          300: '#9db8ff',
          400: '#748eff',
          500: '#4f63f7',
          600: '#3a42ea',
          700: '#3033c7',
          800: '#2b2ea0',
          900: '#292d7e',
        },
        accent: {
          400: '#22d3c5',
          500: '#0fb8ab',
          600: '#0a988e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.10)',
        cardHover: '0 4px 12px 0 rgba(16, 24, 40, 0.10), 0 8px 24px 0 rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
